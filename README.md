# permission-manager

## Description

The permission-manager is a tool designed to facilitate Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) permissions within a hierarchical application structure.

## Workflow

1. Define the hierarchical structure of your application with modules: Context and Product.
2. Configure access policies based on a many-to-many relation (context - subject).
3. Optionally configure your Adapters.
4. Integrate the permission manager into Middlewares or application logic.

## Permission Manager Configuration

It's recommended to configure the permission manager during app setup. This can be broken down into three main topics:

### 1. Define App Structure

We differentiate between a context and a product:

- A context contains roles that an actor can claim.
- A product doesn't have roles and represents entities that can be created by actors.

### Example Usage

![App structure](img/structure.png)

```typescript
import { Context, Product } from './src/PermissionManager';

const community = new Context(
    'community',  // Name of context
    ['admin', 'member'], // Array of role names
);

const group = new Context(
    'group', // Name of context
    ['leader', 'member'],// Array of role names
    new Set([community]), // A set of parents
);

const item = new Product(
    'item', // Name of product
    new Set([group]), // A set of parents
);
```

### 2. Build Access Policies

To configure access policies within the `permission-manager`, follow these steps:

1. **Create a New Instance**: Instantiate a new `PermissionManager` instance.

2. **Configure Access Policies**: Utilize the `configureAccessPolicies` method to set up access policies. This function will be injected with an object containing the subject and the contexts.

### Example Usage
```typescript
import { PermissionManager, AccessPolicyConfiguration } from './src/PermissionManager';

// Create a new instance of PermissionManager
const permissionManager = new PermissionManager('guard');

// Configure access policies using the configureAccessPolicies method
permissionManager.accessPolicies.configureAccessPolicies(({ subject, contexts }: AccessPolicyConfiguration) => {

    // Destructure the contexts object
    const { community, group } = contexts;

    // Switch statement to define access policies based on the subject
    switch (subject.name) {
        case 'community':
            // Define access policies for community context
            community.admin({ create: 0, read: 1, update: 1, delete: 0, invite: 1 });
            community.member({ create: 0, read: 1, update: 0, delete: 0, invite: 1 });
            break;

        case 'group':
            // Define access policies for group context
            community.admin({ create: 1, read: 1, update: 1, delete: 1, invite: 1 });
            group.leader({ create: 0, read: 1, update: 1, delete: 0, invite: 1 });
            group.member({ create: 0, read: 1, update: 0, delete: 0, invite: 1 });
            break;

        case 'item':
            // Define access policies for item context
            community.admin({ create: 1, read: 1, update: 1, delete: 1 });
            group.leader({ create: 1, read: 1, update: 1, delete: 1 });
            group.member({ create: 1, read: 1, update: 0, delete: 0 });
            break;
    }
});

```


### 3. Optional: Configure Adapters
The permission manager expects a specific format for memberships and subjects to check allowances. 
To facilitate this conversion process, you can configure adapters that automatically transform your memberships and subjects into the required format.

### Example Usage
```typescript
import { Membership, MembershipAdapter, Subject, SubjectAdapter } from './src/PermissionManager';

// Custom adapter for transforming memberships to the expected format
class AppMembershipAdapter extends MembershipAdapter {
    adapt(memberships: any[]): Membership[] {
        return memberships.map((m) => ({
            contextName: m.type,
            contextKey: m.key,
            roleName: m.role,
            ancestors: m.ancestors || {}
        }));
    }
}

// Instantiate and use the custom membership adapter
const appMembershipAdapter = new AppMembershipAdapter();

// Custom adapter for transforming subjects to the expected format
class AppSubjectAdapter extends SubjectAdapter {
    adapt(s: any): Subject {
        return {
            name: s.type,
            key: s.key,
            ancestors: s.ancestors || {}
        };
    }
}

// Instantiate and use the custom subject adapter
const appSubjectAdapter = new AppSubjectAdapter();
```

## Permission Manager Usage
There are currently two ways to use permission-manager within app logic:

1. **isPermissionAllowed:** Checks if a permission is allowed. It returns a simple boolean. Additionally, it checks the ancestor roles of a subject.

### Example Usage

```typescript
const isAllowed = permissionManager.isPermissionAllowed(memberships, 'read', subject);
```
2. **getActorPolicies:** Returns an object with all action allowances and action allowances of child subjects. This object can be used to extend a subject with, for example, a 'canDo' property. This can be utilized on the client-side, so clients don't need to know which role an actor has to determine their permissions

### Example Usage
```typescript
const canDo = permissionManager.getActorPolicies(memberships, subject);
```

## Contributors
(Add contributors if applicable)

## License
(Include license details)

