# Permission manager APIS

<div align="center">
[cellajs.com](https://cellajs.com) &centerdot; prerelease version &centerdot; MIT license

![Node.js](https://img.shields.io/badge/Node.js-%2343853D?logo=node.js&logoColor=white) &middot; ![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?logo=typescript&logoColor=white)

</div>

#### Contents
- [Context API](#Context-API)
- [Product API](#Product-API)
- [PermissionManager API](#PermissionManager-API)

## Context API
Recognizable entities within the application that maintain roles which can be claimed by actors.
A Context is a subclass of a HierarchicalEntity.

> Context: Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the context |
| roles | Yes | `Array<String>` | These represent distinct role names available within a context |
| parents | No | `Set<HierarchicalEntity>` | Parent entities |

> Context: Usage

```typescript
import { Context } from '@cellajs/permission-manager';

const rootEntity = new Context(
    'root', // name
    ['rootAdmin', 'rootMember'], // roles
);

const leaveEntity = new Context(
    'leave', // name
    ['leaveAdmin', 'leaveMember'], // roles
    new Set([rootEntity]), // parents
);
```
> *You don't need to specify the 'parents' parameter for a root entity in the hierarchical structure.

> *You only need to specify the direct parent (excluding ancestors higher in the structure).

> *Specifying multiple parents results in a polyhierarchical leaf node.

## Product API
The tangible entities within the application. 
Unlike contexts, products do not have roles to claim; they are entities that are accessed and manipulated by actors based on their assigned roles and permissions within the respective contexts.
A Product is a subclass of a HierarchicalEntity.

> Product: Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the product |
| parents | No | `Set<HierarchicalEntity>` | Parent entities |

> Product: Usage

```typescript
import { Product } from '@cellajs/permission-manager';

const product = new Product(
    'product', // name
    new Set([context]), // parents
);
```

> *It's recommended that products are always attached to at least one parent.


## PermissionManager API
The permission manager evaluates user permissions based on the established hierarchical structure and configured access policies.

> PermissionManager: Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the permission manager |

> PermissionManager: Usage

```typescript
import { PermissionManager } from '@cellajs/permission-manager';

const permissionManager = new PermissionManager(
    'guard', // name
);
```

