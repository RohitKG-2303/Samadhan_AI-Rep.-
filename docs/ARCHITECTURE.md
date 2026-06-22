# Samadhan_AI Architecture

## System Overview

Samadhan_AI is a microservices-based platform with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│          React Components + State Management                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (NestJS)                        │
│        Auth | Validation | Rate Limiting | CORS             │
└────────────────────────────────���────────────────────────────┘
                            ↓
        ┌───────────────────┬────────────────────┐
        ↓                   ↓                    ↓
┌──────────────┐   ┌───────────────┐   ┌─────────────────┐
│   Postgres   │   │   MongoDB     │   │   Redis Cache   │
│  (Relations) │   │  (Documents)  │   │  (Sessions)     │
└──────────────┘   └───────────────┘   └─────────────────┘
        ↑                   ↑                    ↑
        └───────────────────┼────────────────────┘
                            ↓
                   ┌─────────────────────┐
                   │  Vector DB (Pine)   │
                   │  (Embeddings)       │
                   └─────────────────────┘
                            ↑
        ┌───────────────────┴────────────────────┐
        ↓                                         ↓
┌──────────────────────┐          ┌─────────────────────────┐
│  ML Services (Python)│          │  OpenAI/Claude API      │
│ - Embeddings         │          │                         │
│ - Document Process   │          │  LLM Models             │
│ - Comparison         │          │                         │
│ - Signal Analysis    │          │                         │
└──────────────────────┘          └─────────────────────────┘
```

## Core Modules

### 1. Authentication Module
- JWT-based authentication
- User registration & login
- Token refresh mechanism
- Role-based access control (RBAC)

### 2. Troubleshooting Module
- Query vectorization using LLM embeddings
- Document retrieval from vector DB
- LLM response generation with context
- Feedback collection and storage

### 3. Documents Module
- Document upload & storage (S3)
- Metadata indexing (PostgreSQL)
- PDF/document parsing (ML Service)
- Document comparison & review
- Error detection pipeline

### 4. Learning Module
- Learning post creation
- Formatted document generation
- Search & retrieval
- Tagging system
- Integration with troubleshooting

### 5. Signals Module
- Diagram/schematic upload
- Signal flow visualization
- Unit connection mapping
- Interactive graph analysis

### 6. Analytics Module
- Real-time metrics calculation
- User activity tracking
- Query statistics
- Learning usage analytics
- Dashboard data aggregation

## Data Flow

### Troubleshooting Query Flow
1. User asks question → Frontend sends to API
2. Backend validates & extracts intent
3. Query vectorized via embeddings service
4. Pinecone retrieves top-k relevant documents
5. LLM generates answer with retrieved context
6. Answer streamed to frontend + stored in DB
7. User provides feedback → stored for continuous improvement

### Document Upload Flow
1. User uploads document → S3 storage
2. Metadata saved in PostgreSQL
3. Document processed by ML service (PDF parsing)
4. Content chunked & embedded
5. Embeddings stored in Pinecone
6. Indexed for retrieval

### Learning Sharing Flow
1. User creates learning post
2. Content formatted per project template
3. Stored in MongoDB
4. Embedded for semantic search
5. Available in troubleshooting context
6. Analytics tracked

## Technology Stack Rationale

### PostgreSQL
- Relational data: users, documents metadata, feedback
- ACID compliance for consistency
- Full-text search capabilities

### MongoDB
- Flexible schema for learning posts
- Document storage
- Rich query capabilities

### Pinecone
- Vector database optimized for similarity search
- Scales for large document collections
- Fast retrieval for real-time Q&A

### Redis
- Session management
- Rate limiting
- Caching layer
- Fast pub/sub for real-time features

### OpenAI/Claude
- State-of-the-art LLM capabilities
- Embedding models
- Context-aware generation

## Security Considerations

1. **Authentication**: JWT with secure refresh tokens
2. **Authorization**: Role-based access control
3. **Data Protection**: Encrypted connections (TLS)
4. **Input Validation**: Comprehensive validation pipeline
5. **Rate Limiting**: Prevent API abuse
6. **File Uploads**: Validation & sandboxing
7. **Logging**: Audit trail for compliance

## Scalability Strategy

1. **Horizontal Scaling**: Stateless backend services
2. **Database Sharding**: PostgreSQL partitioning for large datasets
3. **Caching**: Redis layer for frequently accessed data
4. **CDN**: Static assets delivery
5. **Load Balancing**: Distribute traffic across instances
6. **Async Processing**: Background jobs for heavy lifting

## Deployment

- Docker containerization for all services
- Docker Compose for local development
- Kubernetes for production (recommended)
- CI/CD via GitHub Actions
- Environment-based configuration
