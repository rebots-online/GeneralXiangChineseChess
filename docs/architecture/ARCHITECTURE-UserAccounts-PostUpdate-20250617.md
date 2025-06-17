# User Accounts & Profiles Architecture (After Update)

The application now persists user profiles using localStorage and exposes a profile editing page.

```mermaid
graph TD
    A[Next.js App]
    B[InteractiveBoard]
    C[Sidebar]
    D[AuthService]
    E[ProfileService]
    F[Profile Page]
    A --> B
    A --> C
    A --> D
    A --> F
    B --> D
    D --> E
    F --> E
```

* `ProfileService` stores `UserProfile` objects using the browser's localStorage.
* `/profile` allows users to view and update their profile.
* The sidebar links to the profile page.
