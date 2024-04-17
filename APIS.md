# Permission manager APIS

<div align="center">
[cellajs.com](https://cellajs.com) &centerdot; prerelease version &centerdot; MIT license

![Node.js](https://img.shields.io/badge/Node.js-%2343853D?logo=node.js&logoColor=white) &middot; ![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?logo=typescript&logoColor=white)

</div>

#### Contents
- [Context API](#Context-API)

## Context API
Recognizable entities within the application that maintain roles which can be claimed by actors.
A HierarchicalEntity serves as the superclass of both Context and Product.

> Constructor

| Param | Required| Type | Description|
|----------|----------|----------|----------|
| name | Yes | `String` | The name of the context |
| roles | Yes | `Array<String>` | These represent distinct role names available within a context |
| parents | No | `Set<HierarchicalEntity>` | Parent entities |

> Usage

```typescript
// Import or Require
import { Context } from '@cellajs/permission-manager';

// Since this is the root entity in the Hierarchical Structure, the 'parents' parameter is not required.
const rootEntity = new Context(
    'root', // name
    ['rootAdmin', 'rootMember'], // roles
);

// You only need to specify the direct parent.
// Specifying multiple parents results in a polyhierarchical leaf node.
const leaveEntity = new Context(
    'leave', // name
    ['leaveAdmin', 'leaveMember'], // roles
    new Set([rootEntity]), // parents
);
```
