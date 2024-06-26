<div align="center">
    <img src="./.github/banner.png" />
<br />

[cellajs.com](https://cellajs.com) &centerdot; prerelease version &centerdot; MIT license &centerdot; ![Dutch](https://raw.githubusercontent.com/stevenrskelton/flag-icon/master/png/16/country-4x3/nl.png) ![Europe](https://raw.githubusercontent.com/stevenrskelton/flag-icon/master/png/16/country-4x3/europeanunion.png)

![Node.js](https://img.shields.io/badge/Node.js-%2343853D?logo=node.js&logoColor=white) &middot; ![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?logo=typescript&logoColor=white) &middot; ![Tap.js](https://img.shields.io/badge/Tap.js-%23375A81?logo=tap&logoColor=white)

</div>

#### Prerelease

> ❗ Please be aware this is a prerelease. It does not meet production requirements yet.

#### Contents
- [Description](#Description)
- [Installation](#Installation)
- [Test](#Test)
- [Quick Start](#Quick-Start)
- [Roadmap](#Roadmap)
- [License](#License)

#### Additional Resources
> Explore more detailed documentation and resources to enhance your understanding and implementation of the Permission Manager module.
- [API's](APIS.md)

## Description
The permission-manager is a tool designed to facilitate Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) permissions within a hierarchical application structure. 

This first release is primarily integrated with [cella.js](https://cellajs.com/about) and will be utilized for [Shareworks applications](https://www.shareworks.nl/).


## Installation
Install the module via npm:
```bash
npm install --save @cellajs/permission-manager
```

## Test
Run tests with npm:
```bash
npm run test
```

## Quick Start

Implementing the Permission Manager involves 4 steps:

| Step | Subject | Description |
|----------|----------|----------|
| 1 | *Hierarchical structure | Define the hierarchical structure of your application, distinguishing between actors, contexts, roles, and products.|
| 2 | *Access Policies | Establish access policies based on a many-to-many relationship between different contexts and their corresponding roles, ensuring precise control over permissions. |
| 3 | _(Optional)_ Adapters | Optionally configure adapters to seamlessly integrate the permission manager within your application ecosystem. |
| 4 | *Integrate | Integrate the permission manager into middleware layers or directly into application logic to enforce access control throughout the application's execution flow. |

> ❗ During the setup of your application, it's recommended to import and configure the permission manager to establish access control mechanisms. 
This ensures that access to different parts of your application is properly regulated based on predefined roles and permissions.

```typescript
// 1. Define Hierarchical Structure:
import { Context, Product } from '@cellajs/permission-manager';

const community = new Context('community', ['admin', 'member']);
const subCommunity = new Context('subCommunity', ['follower'], new Set([community]));

new Product('post', new Set([subCommunity]));

// 2. Establish access policies:
import { PermissionManager, AccessPolicyConfiguration } from '@cellajs/permission-manager';

const permissionManager = new PermissionManager('permissionManager');
permissionManager.accessPolicies.configureAccessPolicies(({ subject, contexts }: AccessPolicyConfiguration) => {
    switch (subject.name) {
      case 'community':
        contexts.community.admin({ create: 0, read: 1, update: 1, delete: 0 });
        contexts.community.member({ create: 0, read: 1, update: 0, delete: 0 });
        break;
      case 'subCommunity':
        contexts.community.admin({ create: 1, read: 1, update: 1, delete: 1 });
        contexts.subCommunity.follower({ create: 0, read: 1, update: 0, delete: 0 });
        break;
      case 'post':
        contexts.community.admin({ create: 1, read: 1, update: 1, delete: 1 });
        contexts.subCommunity.follower({ create: 1, read: 1, update: 0, delete: 0 });
        break;
    };
});

// 3. Optionally configure adapters (see API's documentation)

// 4. Integrate into middleware layers
const memberships = [{ contextName: 'community', contextKey: 1, roleName: 'admin', ancestors: {}}];
const subject = { name: 'community', key: 1 };

const isAllowed = permissionManager.isPermissionAllowed(memberships, 'read', subject);
const canDo = permissionManager.getActorPolicies(memberships, subject);
}
```

## Roadmap
Here are the future steps planned for the development of this project:

- **Add tests:** Implement comprehensive testing to ensure code stability and reliability.
  
- **Create more attribute-based features:** Expand the functionality of the project by introducing additional attribute-based features.

- **Write technical documentation:** Document the technical aspects of the project to facilitate understanding and collaboration among developers.

- **Create documentation for different complex implementations:** Provide documentation for various complex implementations to assist users in understanding and utilizing advanced features.


## License
MIT License

Copyright (c) 2024 @cellajs/permission-manager

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

