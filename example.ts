import {
  type AccessPolicyConfiguration,
  Context,
  type Membership,
  MembershipAdapter,
  PermissionManager,
  Product,
  type Subject,
  SubjectAdapter,
} from './src/index';

// Create app structure
const organization = new Context('organization', ['admin', 'staff', 'student']);

const faculty = new Context('faculty', ['admin', 'staff', 'student'], new Set([organization]));

const course = new Context('course', ['admin', 'staff', 'student'], new Set([faculty]));

const item = new Product('item', new Set([course]));

new Product('comment', new Set([item]));

// Configure permissionManager with access polices
const permissionManager = new PermissionManager('cella');

permissionManager.accessPolicies.configureAccessPolicies(({ subject, contexts }: AccessPolicyConfiguration) => {
  const { organization, faculty, course } = contexts;

  switch (subject.name) {
    case 'organization':
      organization.admin({ create: 0, read: 1, update: 1, delete: 0, invite: 1, list: 1 });
      organization.staff({ create: 0, read: 1, update: 0, delete: 0, invite: 1, list: 1 });
      organization.student({ create: 0, read: 1, update: 0, delete: 0, invite: 0, list: 1 });
      break;

    case 'faculty':
      organization.admin({ create: 1, read: 1, update: 1, delete: 1, invite: 1, list: 1 });
      faculty.admin({ create: 0, read: 1, update: 1, delete: 0, invite: 1, list: 1 });
      faculty.staff({ create: 0, read: 1, update: 0, delete: 0, invite: 1, list: 1 });
      faculty.student({ create: 0, read: 1, update: 0, delete: 0, invite: 0, list: 1 });
      break;

    case 'course':
      organization.admin({ create: 1, read: 1, update: 1, delete: 1, invite: 1, list: 1 });
      course.staff({ create: 0, read: 1, update: 1, delete: 0, invite: 1, list: 1 });
      course.student({ create: 0, read: 1, update: 0, delete: 0, invite: 0, list: 1 });
      break;

    case 'item':
      organization.admin({ create: 1, read: 1, update: 1, delete: 1, invite: 0, list: 1 });
      course.staff({ create: 1, read: 1, update: 0, delete: 0, invite: 0, list: 1 });
      break;

    case 'comment':
      organization.admin({ create: 1, read: 1, update: 1, delete: 1, invite: 0, list: 1 });
      course.staff({ create: 1, read: 1, update: 0, delete: 0, invite: 0, list: 1 });
      break;
  }
});

// Transforms memberships from cella format to the expected format.
class CellaMembershipAdapter extends MembershipAdapter {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  adapt(memberships: any[]): Membership[] {
    return memberships.map((m) => {
      return {
        contextName: m.type,
        contextKey: m.key,
        roleName: m.role,
        ancestors: m.ancestors || {},
      };
    });
  }
}

new CellaMembershipAdapter();

// Transforms subjects from cella format to the expected format.
class CellaSubjectAdapter extends SubjectAdapter {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  adapt(s: any): Subject {
    return {
      name: s.type,
      key: s.key,
      ancestors: s.ancestors || {},
    };
  }
}

new CellaSubjectAdapter();

// Example memberships and subject
const memberships = [
  { type: 'organization', key: 'organization_1', role: 'staff', ancestors: {} },
  { type: 'faculty', key: 'faculty_1', role: 'staff', ancestors: {} },
  { type: 'course', key: 'course_1', role: 'staff', ancestors: { organization: 'organization_1' } },
];
const subject = { type: 'course', key: 'course_1', ancestors: { organization: 'organization_1' } };

// Tests
const isAllowed = permissionManager.isPermissionAllowed(memberships, 'read', subject);
const canDo = permissionManager.getActorPolicies(memberships, subject);

console.log('isAllowed: ', isAllowed);
console.log('canDo: ', canDo);
