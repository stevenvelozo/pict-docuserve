# Diagrams

Docuserve supports [Mermaid](https://mermaid.js.org/) diagrams out of the box. Any fenced code block with the language `mermaid` is automatically rendered as an interactive diagram.

## Flowcharts

Flowcharts describe processes and decision trees.

```mermaid
graph TD
    A[User Request] --> B{Authenticated?}
    B -->|Yes| C[Load Dashboard]
    B -->|No| D[Redirect to Login]
    D --> E[Enter Credentials]
    E --> F{Valid?}
    F -->|Yes| C
    F -->|No| G[Show Error]
    G --> E
```

**Source:**

````
```mermaid
graph TD
    A[User Request] --> B{Authenticated?}
    B -->|Yes| C[Load Dashboard]
    B -->|No| D[Redirect to Login]
    D --> E[Enter Credentials]
    E --> F{Valid?}
    F -->|Yes| C
    F -->|No| G[Show Error]
    G --> E
```
````

### Horizontal flowchart

Use `graph LR` for left-to-right layouts.

```mermaid
graph LR
    A[Markdown] --> B[parseMarkdown]
    B --> C[HTML]
    C --> D[DOM]
    D --> E[Mermaid]
    D --> F[KaTeX]
    E --> G[SVG Diagrams]
    F --> H[Rendered Equations]
```

**Source:**

````
```mermaid
graph LR
    A[Markdown] --> B[parseMarkdown]
    B --> C[HTML]
    C --> D[DOM]
    D --> E[Mermaid]
    D --> F[KaTeX]
    E --> G[SVG Diagrams]
    F --> H[Rendered Equations]
```
````

## Sequence Diagrams

Sequence diagrams show interactions between participants over time.

```mermaid
sequenceDiagram
    participant Browser
    participant Docuserve
    participant Provider
    participant GitHub

    Browser->>Docuserve: Navigate to #/doc/fable/fable
    Docuserve->>Provider: resolveDocumentURL()
    Provider-->>Docuserve: raw.githubusercontent.com URL
    Docuserve->>GitHub: GET /docs/README.md
    GitHub-->>Docuserve: Markdown content
    Docuserve->>Provider: parseMarkdown()
    Provider-->>Docuserve: HTML
    Docuserve->>Browser: Display content
```

**Source:**

````
```mermaid
sequenceDiagram
    participant Browser
    participant Docuserve
    participant Provider
    participant GitHub

    Browser->>Docuserve: Navigate to #/doc/fable/fable
    Docuserve->>Provider: resolveDocumentURL()
    Provider-->>Docuserve: raw.githubusercontent.com URL
    Docuserve->>GitHub: GET /docs/README.md
    GitHub-->>Docuserve: Markdown content
    Docuserve->>Provider: parseMarkdown()
    Provider-->>Docuserve: HTML
    Docuserve->>Browser: Display content
```
````

## Class Diagrams

Class diagrams describe object-oriented structures and relationships.

```mermaid
classDiagram
    class Fable {
        +settings
        +log
        +addServiceType(name, class)
        +instantiateServiceProvider(name)
    }
    class ServiceProviderBase {
        +fable
        +options
        +serviceType
        +initialize()
    }
    class Meadow {
        +schema
        +query
        +doRead()
        +doReads()
        +doCreate()
        +doUpdate()
        +doDelete()
    }
    class Orator {
        +server
        +startService()
        +use(middleware)
    }
    class Pict {
        +views
        +providers
        +render()
    }

    Fable <|-- ServiceProviderBase
    ServiceProviderBase <|-- Meadow
    ServiceProviderBase <|-- Orator
    ServiceProviderBase <|-- Pict
```

**Source:**

````
```mermaid
classDiagram
    class Fable {
        +settings
        +log
        +addServiceType(name, class)
        +instantiateServiceProvider(name)
    }
    class ServiceProviderBase {
        +fable
        +options
        +serviceType
        +initialize()
    }
    class Meadow {
        +schema
        +query
        +doRead()
        +doReads()
        +doCreate()
        +doUpdate()
        +doDelete()
    }
    class Orator {
        +server
        +startService()
        +use(middleware)
    }
    class Pict {
        +views
        +providers
        +render()
    }

    Fable <|-- ServiceProviderBase
    ServiceProviderBase <|-- Meadow
    ServiceProviderBase <|-- Orator
    ServiceProviderBase <|-- Pict
```
````

## State Diagrams

State diagrams model the lifecycle of an entity.

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> InProgress : Start work
    InProgress --> Review : Submit for review
    Review --> InProgress : Request changes
    Review --> Approved : Approve
    Approved --> Deployed : Deploy
    Deployed --> [*]
    InProgress --> Blocked : Dependency issue
    Blocked --> InProgress : Resolved
```

**Source:**

````
```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> InProgress : Start work
    InProgress --> Review : Submit for review
    Review --> InProgress : Request changes
    Review --> Approved : Approve
    Approved --> Deployed : Deploy
    Deployed --> [*]
    InProgress --> Blocked : Dependency issue
    Blocked --> InProgress : Resolved
```
````

## Entity Relationship Diagrams

ER diagrams show database tables and their relationships.

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        date created
        string status
    }
    LINE_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT ||--o{ LINE_ITEM : "included in"
    PRODUCT {
        int id PK
        string name
        float price
    }
```

**Source:**

````
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        date created
        string status
    }
    LINE_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT ||--o{ LINE_ITEM : "included in"
    PRODUCT {
        int id PK
        string name
        float price
    }
```
````

## Gantt Charts

Gantt charts show project timelines and task dependencies.

```mermaid
gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Core
        Fable v5           :done, f5, 2025-01-01, 30d
        Meadow v3           :active, m3, after f5, 45d
    section Server
        Orator v2           :o2, after m3, 30d
        Orator Endpoints    :oe, after o2, 20d
    section Frontend
        Pict v3             :p3, after f5, 60d
        Pict Forms          :pf, after p3, 30d
    section Tooling
        Docuserve v1        :ds, after p3, 20d
        Indoctrinate v2     :ind, after ds, 15d
```

**Source:**

````
```mermaid
gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Core
        Fable v5           :done, f5, 2025-01-01, 30d
        Meadow v3           :active, m3, after f5, 45d
    section Server
        Orator v2           :o2, after m3, 30d
        Orator Endpoints    :oe, after o2, 20d
    section Frontend
        Pict v3             :p3, after f5, 60d
        Pict Forms          :pf, after p3, 30d
    section Tooling
        Docuserve v1        :ds, after p3, 20d
        Indoctrinate v2     :ind, after ds, 15d
```
````

## Pie Charts

Pie charts show proportional data.

```mermaid
pie title Module Distribution
    "Pict" : 15
    "Meadow" : 13
    "Orator" : 6
    "Fable" : 6
    "Utility" : 10
```

**Source:**

````
```mermaid
pie title Module Distribution
    "Pict" : 15
    "Meadow" : 13
    "Orator" : 6
    "Fable" : 6
    "Utility" : 10
```
````

## Git Graph

Git graphs visualize branch history and merge strategies.

```mermaid
gitGraph
    commit id: "initial"
    branch feature
    checkout feature
    commit id: "add feature"
    commit id: "tests"
    checkout main
    commit id: "hotfix"
    merge feature id: "merge feature"
    commit id: "release"
```

**Source:**

````
```mermaid
gitGraph
    commit id: "initial"
    branch feature
    checkout feature
    commit id: "add feature"
    commit id: "tests"
    checkout main
    commit id: "hotfix"
    merge feature id: "merge feature"
    commit id: "release"
```
````

## Tips

- Mermaid is loaded from CDN. An internet connection is required for diagrams to render.
- If Mermaid is unavailable, the raw diagram source is displayed as a code block.
- Mermaid supports many more diagram types. See the [Mermaid documentation](https://mermaid.js.org/intro/) for the full reference.
- Keep diagrams focused. Complex diagrams with dozens of nodes become hard to read. Split them into smaller diagrams if needed.
