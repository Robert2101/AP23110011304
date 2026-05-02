# Campus Notification System Design

This document outlines the design decisions, database structure, and scaling approach for a campus notification service.

---

## Stage 1: API Design and Real-Time Delivery

The system exposes three core endpoints for handling notifications.

### 1. Fetch User Notifications

Returns all notifications for a user along with unread count.

**Endpoint:** `GET /api/v1/notifications`  
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86",
      "type": "Result",
      "message": "mid-sem",
      "isRead": false,
      "timestamp": "2026-04-22 17:51:30"
    }
  ],
  "unreadCount": 1
}
```

---

### 2. Mark Single Notification as Read

Marks an individual notification as read.

**Endpoint:** `PATCH /api/v1/notifications/:id/read`

**Request Body:**
```json
{
  "isRead": true
}
```

---

### 3. Mark All Notifications as Read

Marks all notifications as read.

**Endpoint:** `POST /api/v1/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "updatedCount": 12
}
```

---

### Real-Time Delivery

Instead of polling, the system uses persistent connections:

- Server-Sent Events (SSE)
- WebSockets

New notifications are pushed to the client immediately after creation, reducing unnecessary network calls.

---

## Stage 2: Database Choice and Schema

**Database:** PostgreSQL  

PostgreSQL is used because notifications require consistent state management (especially read/unread tracking), and the data is structured.

### Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    student_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Index

```sql
CREATE INDEX idx_student_unread 
ON notifications(student_id, is_read);
```

This improves performance for unread notification queries.

### Scaling Strategy

Data is partitioned by `created_at` (monthly) to ensure queries focus only on recent data and avoid scanning large tables.

---

## Stage 3: Query Optimization

### Problem with Basic Query

```sql
SELECT * 
FROM notifications 
WHERE student_id = 1042 
AND is_read = false 
ORDER BY created_at DESC;
```

Issues:

- Fetches unnecessary columns  
- Slows down without proper indexing  

### Better Approach

- Select only required fields  
- Use composite indexes  
- Avoid full table scans  

### Optimized Query Example

```sql
SELECT DISTINCT student_id 
FROM notifications 
WHERE type = 'Placement' 
AND created_at >= NOW() - INTERVAL '7 days';
```

### Indexing Note

Indexing every column is not recommended.  
While it improves read performance, it slows down writes and increases storage overhead.

---

## Stage 4: High Load Handling

Querying the database on every request does not scale.

### Solution: Redis Caching

Cache the following:

- Unread count  
- Recent notifications (top 20)  

### Flow

1. Request hits Redis  
2. On cache miss → query PostgreSQL  
3. Update cache  

### Tradeoff

Cache must be updated or invalidated when notifications are marked as read to avoid stale data.

---

## Stage 5: Reliability and Decoupling

### Problem

Running database writes and external API calls (like email) in a single synchronous flow can:

- Slow down the system  
- Fail partially under load  
- Block server threads  

### Solution: Queue-Based Architecture

```javascript
await db.notifications.bulkCreate(payloads);

for (const student of students) {
  await emailQueue.add('send-alert', {
    studentId: student.id,
    message
  });
}

emailQueue.process(async (job) => {
  await emailService.send(job.data);
});
```

### Benefits

- Faster API response  
- Fault isolation  
- Automatic retries  

---

## Stage 6: Priority Inbox

Notifications are assigned weights:

- Placement: 3  
- Result: 2  
- Event: 1  

### Sorting Logic

1. Sort by priority  
2. Break ties using timestamp (latest first)  

---

## Production Optimization

Sorting in memory is inefficient at scale.

### Redis Sorted Sets (ZSET)

Each notification is assigned a score:

```
score = (priority * 1e9) + timestamp
```

### Advantages

- Fast retrieval using `ZREVRANGE`  
- No repeated sorting  
- Scales efficiently  

---

## Summary

The system is designed to remain efficient as usage grows by combining:

- Real-time delivery  
- Optimized database queries  
- Caching  
- Asynchronous processing  

This ensures low latency, reliability, and scalability.