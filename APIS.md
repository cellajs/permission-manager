# Permission manager APIS

<div align="center">

[cellajs.com](https://cellajs.com) &centerdot; prerelease version &centerdot; MIT license

![Node.js](https://img.shields.io/badge/Node.js-%2343853D?logo=node.js&logoColor=white) &middot; ![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?logo=typescript&logoColor=white)

</div>

#### Contents
Classes:
- [Context API](#Context-API)
- [Product API](#Product-API)
- [PermissionManager API](#PermissionManager-API)

Abstract classes:
- [MembershipAdapter API](#MembershipAdapter-API)
- [SubjectAdapter API](#SubjectAdapter-API)

Interfaces:
- [AccessPolicyConfiguration API](#AccessPolicyConfiguration-API)
- [Membership API](#Membership-API)
- [Subject API](#Subject-API)

## Context API
> Type: Class

Recognizable entities within the application that maintain roles which can be claimed by actors.
A Context is a subclass of a HierarchicalEntity.

#### Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the context |
| roles | Yes | `Array<String>` | These represent distinct role names available within a context |
| parents | No | `Set<HierarchicalEntity>` | Parent entities |

#### Usage

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

#### Extra info
1. You don't need to specify the 'parents' parameter for a root entity in the hierarchical structure.
2. You only need to specify the direct parent (excluding ancestors higher in the structure).
3. Specifying multiple parents results in a polyhierarchical leaf node.

## Product API
> Type: Class

The tangible entities within the application. 
Unlike contexts, products do not have roles to claim; they are entities that are accessed and manipulated by actors based on their assigned roles and permissions within the respective contexts.
A Product is a subclass of a HierarchicalEntity.

#### Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the product |
| parents | No | `Set<HierarchicalEntity>` | Parent entities |

#### Usage

```typescript
import { Product } from '@cellajs/permission-manager';

const product = new Product(
    'product', // name
    new Set([context]), // parents
);
```

#### Extra info
1. It's recommended that products are always attached to at least one parent.

## PermissionManager API
> Type: Class

The permission manager evaluates user permissions based on the established hierarchical structure and configured access policies.

#### Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The (unique) name of the permission manager |

#### Usage

```typescript
import { PermissionManager } from '@cellajs/permission-manager';

const permissionManager = new PermissionManager(
    'guard', // name
);
```

## MembershipAdapter API
> Type: Abstract class

The permission manager requires a specific format for memberships. 
To simplify this conversion process, you can configure the MembershipAdapter that automatically transform your memberships into the required format. 
This adapter is automatically utilized when instantiating an inherited class with an overridden `adapt` method.

#### Usage

```typescript
import { MembershipAdapter, Membership } from '@cellajs/permission-manager';

class AdaptedMembershipAdapter extends MembershipAdapter {
    adapt(memberships: any[]): Membership[] {
        return memberships.map((m) => ({
            contextName: m.type,
            contextKey: m.key,
            roleName: m.role,
            ancestors: m.ancestors || {}
        }));
    }
}

new AdaptedMembershipAdapter();
```

## SubjectAdapter API
> Type: Abstract class

The permission manager requires a specific format for subjects. 
To simplify this conversion process, you can configure the SubjectAdapter to automatically transform your subjects into the required format.
This adapter is automatically utilized when instantiating an inherited class with an overridden `adapt` method.

#### Usage

```typescript
import { SubjectAdapter, Subject } from '@cellajs/permission-manager';

class AdaptedSubjectAdapter extends SubjectAdapter {
    adapt(s: any): Subject {
        return {
            name: s.type,
            key: s.key,
            ancestors: s.ancestors || {}
        };
    }
}

new AdaptedSubjectAdapter();
```

## Membership API
> Type: Interface

The required format for memberships used by the Permission Manager. 
This interface is utilized to configure the `MembershipAdapter`.

#### Attributes
| Property | Type | Description|
|----------|----------|----------|
| contextName | `String` | The name of the associated context |
| contextKey | `String` | The unique key of the associated context |
| roleName | `String` or `Null` | The associated role name |
| ancestors | `Object` | An object mapping ancestor names to unique keys in `String` format |

#### Example
```typescript
const membership = {
  contextName: 'context',
  contextKey: '661fc4ead271ca753b45ac34',
  roleName: 'role',
  ancestors: {
      ancestorA: '661fc4ff448bf34ef2c8e95a',
      ancestorB: '661fc5020cff1878adc12001',
      ancestorC: '661fc5059e22bf1571c79aad',
  }
};
```

## Subject API
> Type: Interface

The required format for subjects used by the Permission Manager. 
This interface is utilized to configure the `SubjectAdapter`.

#### Attributes
| Property | Type | Description|
|----------|----------|----------|
| name | `String` | The name of the subject |
| key | `String` | The unique key of the subject |
| ancestors | `Object` | An object mapping ancestor names to unique keys in `String` format |

#### Example
```typescript
const subject = {
  name: 'subject',
  key: '661fc31d1a90378c89d1636e',
  ancestors: {
      ancestorA: '661fc3297042f4a2ecc3b3fe',
      ancestorB: '661fc33969a82035df3ef943',
      ancestorC: '661fc344f649525f2fc8bb7b',
  },
};
```
## AccessPolicyConfiguration API
> Type: Interface
