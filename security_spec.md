# Security Specification - National Law Chatbot

This specification outlines the data invariants, threat model payloads, and security rules for the National Law Chatbot database schema.

## 1. Data Invariants
- **Session Ownership**: A Session document must always specify a `userId` that matches the authenticated user's UID. Only the owning user can view, list, rename, or delete the session.
- **Message Integrity**: Messages inside `/sessions/{sessionId}/messages/{messageId}` can only be created by the owner of the parent session. Messages are read-only after creation (immutable) to prevent revisionism.
- **Timestamp Integrity**: `createdAt` and `updatedAt` field values must match the server-generated `request.time`.

## 2. The "Dirty Dozen" Payloads (Threat Vectors)

1. **Identity Spoofing (Session)**: Authenticated user A attempts to create a session under user B's auth ID.
2. **Resource Poisoning (Session ID)**: User attempts to inject a 10KB string as the `sessionId` path variable to clog Firestore indexing.
3. **Ghost Fields Injection**: User attempts to inject a `isAdmin: true` field inside the Session document.
4. **Invalid State Change (Session)**: User attempts to change `createdAt` of an existing session during update.
5. **Unauthorized Privilege Modification**: User tries to change `userId` of a session to transfer ownership or access.
6. **Title Boundary Violation**: User tries to write a `title` that is 50KB in length.
7. **Identity Spoofing (Message Subcollection)**: User A attempts to insert a message into user B's private session `/sessions/{sessionB}/messages/{msgId}`.
8. **Invalid Role (Message)**: User attempts to create a message with role `"admin"` (only `"user"` and `"model"` are whitelisted).
9. **Message Mutation**: User attempts to update/edit an existing message (messages must be write-once).
10. **Message Deletion**: User attempts to delete a message in their chat history (messages must remain intact for logging).
11. **Blanket Query Exploitation**: An unauthenticated or random user attempts to query elements of `sessions` without a `where` filter constraining results to their own `userId`.
12. **Temporal Integrity Cheat**: Client attempts to create a session or message with a fabricated future timestamp for `createdAt`.

## 3. Deployment Rules (Draft to Fortress)
The rules enforce:
- Access-Control lists matching `request.auth.uid`.
- Helper-based validation checks on types, bounds, and structures.
- Strict `diff` rules on update operations to avoid sneaky partial changes.
