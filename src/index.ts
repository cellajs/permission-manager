/**
 * Represents a relationship
 * @interface
 */
export interface Relationship {
  polyhierarchicalAncestors?: string[][];
  ancestors?: string[];
  inheritsFrom: string;
}

/**
 * Represents relationships between hierarchical entities.
 * @interface
 */
export interface Relationships {
  [entityName: string]: Relationship;
}

/**
 * Represents the hierarchy of hierarchical entities
 * @interface
 */
export interface Hierachy {
  [entityName: string]: Hierachy;
}

/**
 * Represents a Leave (hierarchical element) in the tree.
 * @interface
 */
export interface Leave {
  name: string;
  UID: string;
  level: number;
  parentUID: string | null;
}

/**
 * Represents a set of action policies where each action is associated with a boolean value.
 * @interface
 */
export interface ActionPolicies {
  [actionName: string]: boolean;
}

/**
 * Represents an access policy defining permissions for a subject within a context and role.
 * @interface
 */
export interface AccessPolicy {
  contextName: string;
  contextRoleName: string;
  subjectName: string;
  subjectRoleName: string | null;
  actionPolicies: ActionPolicies;
}

/**
 * Represents a configuration for action policies.
 * @interface
 */
export interface AccessPolicyConfiguration {
  subject: HierarchicalEntity;
  contexts: {
    [contextName: string]: {
      // biome-ignore lint/complexity/noBannedTypes: The callback function provided by the user configures AccessPolicy.
      [roleName: string]: Function;
    };
  };
}

/**
 * Represents a membership within a context and a role.
 * @interface
 */
export interface Membership {
  contextName: string;
  contextKey: string;
  roleName: string | null;
  ancestors: {
    [ancestorName: string]: string | null | undefined;
  };
}

/**
 * Represents a subject entity for which permissions are being checked.
 * @interface
 */
export interface Subject {
  name: string;
  key: string;
  ancestors: {
    [ancestorName: string]: string | null | undefined;
  };
}

/**
 * An abstract class representing a membership adapter.
 * Subclasses of MembershipAdapter must implement the adapt method.
 * When instantiated, a subclass automatically registers itself as the membership adapter with PermissionManager.
 */
export abstract class MembershipAdapter {
  /**
   * Constructs a new instance of MembershipAdapter.
   * Automatically registers the subclass as the membership adapter with PermissionManager.
   */
  constructor() {
    PermissionManager.membershipAdapter = this;
  }

  /**
   * Adapts an array of memberships from a custom format to the expected Membership format.
   * This method must be implemented by subclasses.
   * @param {any[]} memberships - The array of memberships to adapt.
   * @returns {Membership[]} The adapted array of memberships.
   * @abstract
   */

  // biome-ignore lint/suspicious/noExplicitAny: The type of 'memberships' can vary based on the developer's application requirements.
  abstract adapt(memberships: any[]): Membership[];
}

/**
 * An abstract class representing a subject adapter.
 * Subclasses of SubjectAdapter must implement the adapt method.
 * When instantiated, a subclass automatically registers itself as the subject adapter with PermissionManager.
 */
export abstract class SubjectAdapter {
  /**
   * Constructs a new instance of SubjectAdapter.
   * Automatically registers the subclass as the subject adapter with PermissionManager.
   */
  constructor() {
    PermissionManager.subjectAdapter = this;
  }

  /**
   * Adapts an subject from a custom format to the expected Subject format.
   * This method must be implemented by subclasses.
   * @param {any} subject - The subject to adapt.
   * @returns {Subject} The adapted subject.
   * @abstract
   */

  // biome-ignore lint/suspicious/noExplicitAny: The type of 'subject' can vary based on the developer's application requirements.
  abstract adapt(subject: any): Subject;
}

/**
 * Represents a map where the keys are subject roles (strings or null) and the values are action policies.
 * @type {Map<string | null, ActionPolicies>}
 */
export type SubjectRoleAccessPolicies = Map<string | null, ActionPolicies>;

/**
 * Represents a map where the keys are subject names (strings) and the values are subject role access policies.
 * @type {Map<string, SubjectRoleAccessPolicies>}
 */
export type SubjectAccessPolicies = Map<string, SubjectRoleAccessPolicies>;

/**
 * Represents a map where the keys are context roles (strings) and the values are subject access policies.
 * @type {Map<string, SubjectAccessPolicies>}
 */
export type ContextRoleAccessPolicies = Map<string, SubjectAccessPolicies>;

/**
 * Represents a map where the keys are context names (strings) and the values are context role access policies.
 * @type {Map<string, ContextRoleAccessPolicies>}
 */
export type ContextAccessPolicies = Map<string, ContextRoleAccessPolicies>;

/**
 * Function to generate a random UID
 * @returns {string} UID.
 */
export function generateUID(): string {
  // Generate a random UID using a combination of current timestamp and random number
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Checks if two sets have at least one common element.
 * @param {Set<string>} set1 - The first set to compare.
 * @param {Set<string>} set2 - The second set to compare.
 * @returns {boolean} True if the sets have at least one common element, false otherwise.
 */
export function doSetsHaveCommonElement(set1: Set<string>, set2: Set<string>): boolean {
  for (const item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }
  return false;
}

/**
 * Retrieves the ancestors of a given hierarchical entity.
 * @param {HierarchicalEntity} entity - The hierarchical entity for which ancestors are to be retrieved.
 * @returns {HierarchicalEntity[][]} - An array of arrays representing the ancestors of the given entity.
 */
export function getEntityAncestors(entity: HierarchicalEntity): HierarchicalEntity[][] {
  const polyhierarchicalAncestors: HierarchicalEntity[][] = [];

  // Recursively traverses the parent entities to find ancestors.
  function traverseParents(currentEntity: HierarchicalEntity, ancestors: HierarchicalEntity[] = []): void {
    if (currentEntity.parents && currentEntity.parents.size > 0) {
      for (const parent of currentEntity.parents) {
        traverseParents(parent, [...ancestors, parent]);
      }
    } else {
      polyhierarchicalAncestors.push([...ancestors]);
    }
  }

  traverseParents(entity);

  return polyhierarchicalAncestors;
}

/**
 * Retrieves relationships of given entities.
 * @param {Set<HierarchicalEntity>} entities - An set of hierarchical entities for which relationships are to be retrieved.
 * @returns {Relationships} - An object representing relationships of the given entitiess.
 */
export function getEntityRelationships(entities: Set<HierarchicalEntity>): Relationships {
  // Clean object relationships
  const relationships: Relationships = {};

  for (const entity of entities) {
    const relationship: Relationship = {
      inheritsFrom: entity.name,
    };

    // Gather information about relationships (inheritance, ancestors, etc.)
    const polyhierarchicalAncestors = getEntityAncestors(entity);
    relationship.polyhierarchicalAncestors = polyhierarchicalAncestors.map((ancestors) => {
      ancestors.sort((ancestor1, ancestor2) => ancestor2.lowestHierarchyLevel - ancestor1.lowestHierarchyLevel);
      return ancestors.map((ancestor) => ancestor.name);
    });
    relationship.ancestors = [];

    // Add the entity and its relationships to the relationships
    relationships[entity.name] = relationship;
  }

  return relationships;
}

/**
 * Retrieves hierarchy from given relationships.
 * @param {Relationships} relationships - An object representing relationships between hierarchical entities.
 * @returns {Hierachy} - An object representing the hierarchy.
 */
export function getHierarchy(relationships: Relationships): Hierachy {
  const hierachy: Hierachy = {};

  for (const instanceName of Object.keys(relationships)) {
    const relationship = relationships[instanceName];
    const polyhierarchicalAncestors = relationship.polyhierarchicalAncestors || [relationship.ancestors];
    const inheritanceName = relationship.inheritsFrom;

    for (const ancestorNames of polyhierarchicalAncestors) {
      let currentLevel: Hierachy = hierachy;

      for (const ancestorName of ancestorNames?.reverse() || []) {
        currentLevel[ancestorName] = currentLevel[ancestorName] || {};
        currentLevel = currentLevel[ancestorName];
      }

      currentLevel[inheritanceName] = {};
    }
  }

  return hierachy;
}

/**
 * Generates a hierarchical tree from the given hierarchy.
 * @param {Hierachy} hierarchy - The hierarchy to generate the tree from.
 * @param {Leave} [parent] - The parent Leave.
 * @returns {Leave[]} - The hierarchical tree.
 */
export function getHierarchicalTree(hierarchy: Hierachy, parent?: Leave): Leave[] {
  const tree: Leave[] = [];

  const level = (parent?.level || 0) + 1;
  const parentUID = parent?.UID || null;

  for (const name of Object.keys(hierarchy)) {
    const UID = generateUID();
    const element: Leave = { name, UID, level, parentUID };

    if (Object.keys(hierarchy[name]).length > 0) {
      const leaves = getHierarchicalTree(hierarchy[name], element);
      tree.push(...leaves);
    }

    tree.push(element);
  }

  if (!parent) {
    // Sort the tree based on level
    tree.sort((a, b) => a.level - b.level);
  }

  return tree;
}

/**
 * Represents a hierarchical entity.
 */
export class HierarchicalEntity {
  /**
   * Unique identifier (UID) for the hierarchical entity instance.
   * @type {string}
   */
  UID: string;

  /**
   * Set to hold instances of HierarchicalEntity and its subclasses.
   * @type {Set<HierarchicalEntity>}
   * @static
   */
  static instances: Set<HierarchicalEntity> = new Set();

  /**
   * A Map containing instances of HierarchicalEntity, with the entity's name as the key.
   * Used to efficiently retrieve instances by name.
   * @type {Map<string, HierarchicalEntity>}
   */
  static instanceMap: Map<string, HierarchicalEntity> = new Map();

  /**
   * Set of parent entities (direct predecessors in the hierarchy).
   * @type {Set<HierarchicalEntity>}
   */
  parents: Set<HierarchicalEntity> = new Set();

  /**
   * Set of child entities (direct successors in the hierarchy).
   * @type {Set<HierarchicalEntity>}
   */
  children: Set<HierarchicalEntity> = new Set();

  /**
   * Set of ancestor entities (entities located above in the hierarchy, including parents, grandParents, etc.).
   * @type {Set<HierarchicalEntity>}
   */
  ancestors: Set<HierarchicalEntity> = new Set();

  /**
   * Set of descendant entities (entities lower in the hierarchy).
   * @type {Set<HierarchicalEntity>}
   */
  descendants: Set<HierarchicalEntity> = new Set();

  /**
   * Set of necessary or required ancestor entities.
   * @type {Set<HierarchicalEntity>}
   */
  requiredAncestors: Set<HierarchicalEntity> = new Set();

  /**
   * Set of entities that own access control for this instance.
   * @type {Set<HierarchicalEntity>}
   */
  owners: Set<HierarchicalEntity> = new Set();

  /**
   * Set of entities for which this instance controls access control.
   * @type {Set<HierarchicalEntity>}
   */
  controllers: Set<HierarchicalEntity> = new Set();

  /**
   * Name of the hierarchical entity.
   * @type {string}
   */
  name: string;

  /**
   * lowest hierarchical level based on parent entities.
   * @type {number}
   */
  lowestHierarchyLevel = 1;

  /**
   * Set containing ancestors sorted in descending order.
   * @type {Set<HierarchicalEntity>}
   */
  descSortedAncestors: Set<HierarchicalEntity> = new Set();

  /**
   * Creates an instance of HierarchicalEntity.
   * @param {string} name - The name of the hierarchical entity.
   * @param {Set<HierarchicalEntity>} parents - Parent entities
   */
  constructor(name: string, parents: Set<HierarchicalEntity> = new Set()) {
    this.UID = generateUID();
    this.name = name;
    this.parents = parents;
    this.registerInstance();
    this.setLowestHierarchicalLevel();
    this.buildParentChildRelations();
    this.buildAncestorsRelations();
    this.buildSortedAncestors();
  }

  /**
   * Registers an instance with the set and throws an error if an instance with the same name already exists.
   * @throws {Error} - If an instance with the same name already exists.
   */
  private registerInstance(): void {
    if (HierarchicalEntity.instanceMap.has(this.name)) {
      throw new Error(`Hierarchical instance with name '${this.name}' already exists.`);
    }

    HierarchicalEntity.instances.add(this);
    HierarchicalEntity.instanceMap.set(this.name, this);
  }

  /**
   * Sets the lowest hierarchical level based on parent entities.
   * @returns {void}
   */
  setLowestHierarchicalLevel(): void {
    let newLowestLevel = 1;

    for (const parent of this.parents) {
      const parentLevel = parent.lowestHierarchyLevel + 1;
      newLowestLevel = Math.max(newLowestLevel, parentLevel);
    }

    this.lowestHierarchyLevel = newLowestLevel;
  }

  /**
   * Builds parent-child relations and updates access policy controllers and owners.
   * @returns {void}
   */
  buildParentChildRelations(): void {
    for (const parent of this.parents) {
      parent.addChild(this);
      const owners = parent.addController(this);
      for (const owner of owners) {
        this.owners.add(owner);
      }
    }
  }

  /**
   * Adds a child to the HierarchicalEntity.
   * @param {HierarchicalEntity} child - The child to add.
   * @returns {void}
   */
  addChild(child: HierarchicalEntity): void {
    this.children.add(child);
    this.updateDescendants(child);
  }

  /**
   * Updates descendants of the current entity and its ancestors with a new child.
   * @param {HierarchicalEntity} child - The child entity to add.
   * @returns {void}
   */
  updateDescendants(child: HierarchicalEntity): void {
    this.descendants.add(child);
    for (const ancestor of this.ancestors) {
      ancestor.descendants.add(child);
    }
  }

  /**
   * Adds a controller to the HierarchicalEntity.
   * @param {HierarchicalEntity} controller - The controller entity to add.
   * @returns {Set<HierarchicalEntity>} - The set of entities that own the access policies for the added controller.
   */
  addController(controller: HierarchicalEntity): Set<HierarchicalEntity> {
    const owners = new Set<HierarchicalEntity>();

    if (this instanceof Context) {
      this.controllers.add(controller);
      owners.add(this);
    } else {
      for (const parent of this.parents) {
        const parentOwners = parent.addController(controller);
        for (const owner of parentOwners) {
          owners.add(owner);
        }
      }
    }

    return owners;
  }

  /**
   * Builds ancestor relations.
   * @returns {void}
   */
  buildAncestorsRelations(): void {
    for (const parent of this.parents) {
      this.ancestors.add(parent);
      for (const ancestor of parent.ancestors) {
        this.ancestors.add(ancestor);
      }
    }

    for (const ancestor of this.ancestors) {
      if (this.isRequiredAncestor(ancestor)) this.requiredAncestors.add(ancestor);
    }
  }

  /**
   * Checks if an ancestor is required.
   * @param {HierarchicalEntity} ancestor - The ancestor to check.
   * @returns {boolean} - True if the ancestor is required, false otherwise.
   */
  isRequiredAncestor(ancestor: HierarchicalEntity): boolean {
    for (const parent of this.parents) {
      if (ancestor !== parent && !parent.requiredAncestors.has(ancestor)) return false;
    }
    return true;
  }

  /**
   * Builds a sorted set of ancestors based on their lowest hierarchy level in descending order.
   * @returns {void}
   */
  buildSortedAncestors(): void {
    this.descSortedAncestors = new Set(
      [...this.ancestors].sort((ancestor1, ancestor2) => ancestor2.lowestHierarchyLevel - ancestor1.lowestHierarchyLevel),
    );
  }
}

/**
 * Represents a context entity.
 */
export class Context extends HierarchicalEntity {
  /**
   * Set to hold instances of Roles of this context
   * @type {Set<Role>}
   */
  roles: Set<Role> = new Set();

  /**
   * Creates an instance of Context.
   * @param {string} name - The name of the context.
   * @param {string[]} roles - Array of role names associated with this context.
   * @param {Set<HierarchicalEntity>} parents - Parent entities.
   */
  constructor(name: string, roles: Array<string>, parents: Set<HierarchicalEntity> = new Set()) {
    super(name, parents);
    for (const roleName of roles) {
      this.roles.add(new Role(roleName, this));
    }
  }
}

/**
 * Represents a product entity.
 */
export class Product extends HierarchicalEntity {
  /**
   * Creates an instance of Product.
   * @param {string} name - The name of the product.
   * @param {Set<HierarchicalEntity>} parents - Parent entities.
   */
  constructor(name: string, parents: Set<HierarchicalEntity> = new Set()) {
    super(name, parents);
  }
}

/**
 * Represents a role entity.
 */
export class Role {
  /**
   * Unique identifier (UID) for the role instance.
   * @type {string}
   */
  UID: string;

  /**
   * Set to hold instances of Role and its subclasses.
   * @type {Set<Role>}
   * @static
   */
  static instances: Set<Role> = new Set();

  /**
   * Name of the role entity.
   * @type {string}
   */
  name: string;

  /**
   * The context associated with this role.
   * @type {Context}
   */
  context: Context;

  /**
   * Creates an instance of Role.
   * @param {string} name - The name of the role.
   * @param {Context} context - The context associated with this role.
   */
  constructor(name: string, context: Context) {
    this.UID = generateUID();
    this.name = name;
    this.context = context;
    this.registerInstance();
  }

  /**
   * Registers an instance with the set and throws an error if an instance with the same name and context already exists.
   * @throws {Error} - If an instance with the same name and context already exists.
   * @returns {void}
   */
  private registerInstance(): void {
    if (!Role.isUniqueInstance(this)) {
      throw new Error(`Role instance with name '${this.name}' on context '${this.context.name}' already exists.`);
    }

    Role.instances.add(this);
  }

  /**
   * Checks if the set of instances already contains an instance with the given name and context.
   * @param {Role} roleInstance - The role instance to check for uniqueness.
   * @returns {boolean} - True if an instance with the same name and context exists, false otherwise.
   */
  private static isUniqueInstance(roleInstance: Role): boolean {
    for (const instance of Role.instances) {
      const equalName = instance.name === roleInstance.name;
      const equalContext = instance.context === roleInstance.context;
      if (equalName && equalContext) return false;
    }
    return true;
  }
}

/**
 * Represents a AccessPolicies entity.
 */
export class AccessPolicies {
  /**
   * Unique identifier (UID) for the AccessPolicies instance.
   * @type {string}
   */
  UID: string;

  /**
   * Set to hold instances of AccessPolicies and its subclasses.
   * @type {Set<Role>}
   * @static
   */
  static instances: Set<AccessPolicies> = new Set();

  /**
   * A Map containing instances of AccessPolicies, with the entity's name as the key.
   * Used to efficiently retrieve instances by name.
   * @type {Map<string, AccessPolicies>}
   */
  static instanceMap: Map<string, AccessPolicies> = new Map();

  /**
   * Name of the AccessPolicies entity.
   * @type {string}
   */
  name: string;

  /**
   * Set to hold unique actions.
   * @type {Set<string>}
   */
  actions: Set<string> = new Set();

  /**
   * Map to store defined access policies.
   * @type {ContextAccessPolicies}
   */
  definedAccessPolicies: ContextAccessPolicies = new Map();

  /**
   * A set containing access policies.
   * @type {Set<AccessPolicy>}
   */
  accessPolicies: Set<AccessPolicy> = new Set();

  /**
   * A map representing allowed accessPolicyKeys by actionPolicyKey
   * Keys are strings actionPolicyKeys, and values are sets of accessPolicyKeys.
   * @type {Map<string, Set<string>>}
   */
  allowance: Map<string, Set<string>> = new Map();

  /**
   * Creates an instance of AccessPolicies.
   * Initializes the UID property with a unique identifier.
   */
  constructor(name: string) {
    this.UID = generateUID();
    this.name = name;
    this.registerInstance();
  }

  /**
   * Registers an instance with the set and throws an error if an instance with the same name already exists.
   * @throws {Error} - If an instance with the same name already exists.
   * @returns {void}
   */
  private registerInstance(): void {
    if (AccessPolicies.instanceMap.has(this.name)) {
      throw new Error(`PermissionsTree instance with name '${this.name}' already exists.`);
    }

    AccessPolicies.instances.add(this);
    AccessPolicies.instanceMap.set(this.name, this);
  }

  /**
   * Builds access policies based on contexts, roles, and subjects.
   * @returns {void}
   */
  buildAccessPolicies(): void {
    // Clears the existing access policies and allowance.
    this.accessPolicies.clear();
    this.allowance.clear();

    // Iterate through all contexts
    for (const context of Context.instances) {
      // Skip if the instance is not a Context
      if (!(context instanceof Context)) continue;

      // Iterate through context roles
      for (const contextRole of context.roles) {
        // Iterate through entities as subjects
        for (const subject of HierarchicalEntity.instances) {
          // Skip if the context is a descendant of the subject
          if (subject.descendants.has(context)) continue;

          // Get roles associated with subject
          const roles = subject instanceof Context ? subject.roles : [];

          // Iterate through roles including null
          for (const subjectRole of [...roles, null]) {
            // Skip if the context and the subject have different roles
            if (context === subject && contextRole.name !== subjectRole?.name) continue;

            // Retrieve defined action policies for the subject
            const definedActionPolicies: ActionPolicies = this.getDefinedActionPolicies(context, contextRole, subject, subjectRole);

            // Create action policies and add allowance
            const actionPolicies: ActionPolicies = {};
            for (const action of this.actions) {
              actionPolicies[action] = !!definedActionPolicies[action];

              // If action allowed, add allowance
              if (actionPolicies[action]) {
                this.addAllowance(context, contextRole, subject, subjectRole, action);
              }
            }

            // Add to accessPolicies
            this.accessPolicies.add({
              contextName: context.name,
              contextRoleName: contextRole.name,
              subjectName: subject.name,
              subjectRoleName: subjectRole?.name || null,
              actionPolicies,
            });
          }
        }
      }
    }
  }

  /**
   * Retrieves defined action policies for a given subject.
   * @param {Context} context - The context
   * @param {Role} contextRole - The context role
   * @param {HierarchicalEntity} subject - The subject
   * @param {Role|null} subjectRole - The subject role
   * @returns {ActionPolicies | {}} Defined action policy or empty object if not found.
   */

  // biome-ignore lint/complexity/noBannedTypes: Returns empty object when no defined action policies are found.
  getDefinedActionPolicies(context: Context, contextRole: Role, subject: HierarchicalEntity, subjectRole: Role | null): ActionPolicies | {} {
    // Retrieve context access policy
    const contextAccessPolicy = this.definedAccessPolicies.get(context.name);
    if (!contextAccessPolicy) return {};

    // Retrieve context role access policy
    const contextRoleAccessPolicy = contextAccessPolicy.get(contextRole.name);
    if (!contextRoleAccessPolicy) return {};

    // Retrieve subject access policy
    const subjectAccessPolicy = contextRoleAccessPolicy.get(subject.name);
    if (!subjectAccessPolicy) return {};

    // Retrieve subject role access policy
    const subjectRoleAccessPolicy = subjectAccessPolicy.get(subjectRole?.name || null);

    // Return subject role access policy or undefined if not found
    return subjectRoleAccessPolicy || {};
  }

  /**
   * Adds an allowance for a specific action, context, and subject combination.
   * @param {Context} context - The context entity.
   * @param {Role} contextRole - The role within the context.
   * @param {HierarchicalEntity} subject - The subject entity.
   * @param {Role | null} subjectRole - The role of the subject entity, or null if not applicable.
   * @param {string} action - The action for which the allowance is granted.
   * @returns {void}
   */
  addAllowance(context: Context, contextRole: Role, subject: HierarchicalEntity, subjectRole: Role | null, action: string): void {
    const accessPolicyKey = `${context.name}-${contextRole.name}-${subject.name}-${subjectRole?.name || 'null'}`;
    const actionPolicyKey = `${subject.name}-${action}`;

    // Initialize or retrieve the set of allowed actions
    let actionAllowance = this.allowance.get(actionPolicyKey);
    if (!actionAllowance) {
      actionAllowance = new Set();
      this.allowance.set(actionPolicyKey, actionAllowance);
    }

    // Add the accessPolicyKey to the set
    actionAllowance.add(accessPolicyKey);
  }

  /**
   * Configures access policies based on the provided function.
   * @param {Function} fnc - The function to configure access policies.
   * @returns {void}
   */

  // biome-ignore lint/complexity/noBannedTypes: The callback function provided by the user configures AccessPolicy.
  configureAccessPolicies(fnc: Function): void {
    for (const subject of HierarchicalEntity.instances) {
      const accessPolicyObj: AccessPolicyConfiguration = { subject, contexts: {} };

      for (const context of Context.instances) {
        if (context instanceof Context) {
          accessPolicyObj.contexts[context.name] = {};

          for (const role of context.roles) {
            this.createAccessPolicyFunction(accessPolicyObj, context, role, subject);
          }
        }
      }

      fnc(accessPolicyObj);
    }

    this.buildAccessPolicies();
  }

  /**
   * Creates the access policy function for the given context, role, and subject entity.
   * @param {AccessPolicyConfiguration} accessPolicyObj - The access policy object.
   * @param {Context} context - The context entity.
   * @param {Roles} role - The role entity.
   * @param {HierarchicalEntity} subject - The subject entity.
   * @returns {void}
   */
  createAccessPolicyFunction(accessPolicyObj: AccessPolicyConfiguration, context: Context, role: Role, subject: HierarchicalEntity): void {
    accessPolicyObj.contexts[context.name][role.name] = (policy: ActionPolicies) => {
      this.addActionToSet(policy);
      const subjectRoleAccessPolicy = this.getAndEnsureSubjectRoleAccessPolicy(context, role, subject);

      this.setAccessPolicyForSubjectRole(subjectRoleAccessPolicy, context, role, subject, policy);
      this.setAccessPolicyForNullRole(subjectRoleAccessPolicy, policy);
    };
  }

  /**
   * Adds actions to the actions set.
   * @param {ActionPolicies} policy - The access policy object.
   * @returns {void}
   */
  addActionToSet(policy: ActionPolicies): void {
    for (const action of Object.keys(policy)) {
      this.actions.add(action);
    }
  }

  /**
   * Sets the access policy for the subject role.
   * @param {SubjectRoleAccessPolicies} accessPolicy - The access policy map.
   * @param {Roles} role - The role entity.
   * @param {HierarchicalEntity} subject - The subject entity.
   * @param {ActionPolicies} policy - The access policy object.
   * @returns {void}
   */
  setAccessPolicyForSubjectRole(
    accessPolicy: SubjectRoleAccessPolicies,
    context: Context,
    role: Role,
    subject: HierarchicalEntity,
    policy: ActionPolicies,
  ): void {
    if (context.name === subject.name) {
      this.setAccessPolicyForContextRole(accessPolicy, role, policy);
      this.setAncestorAccessPoliciesForRole(role, subject, policy);
    } else {
      this.setSubjectRolePermissions(accessPolicy, subject, policy);
    }
  }

  /**
   * Sets the access policy for the context role.
   * @param {SubjectRoleAccessPolicies} accessPolicy - The access policy map.
   * @param {Roles} role - The role entity.
   * @param {ActionPolicies} policy - The access policy object.
   * @returns {void}
   */
  setAccessPolicyForContextRole(accessPolicy: SubjectRoleAccessPolicies, role: Role, policy: ActionPolicies): void {
    accessPolicy.set(role.name, policy);
  }

  /**
   * Sets the ancestor access policies for the role.
   * @param {Roles} role - The role entity.
   * @param {HierarchicalEntity} subject - The subject entity.
   * @param {ActionPolicies} policy - The access policy object.
   * @returns {void}
   */
  setAncestorAccessPoliciesForRole(role: Role, subject: HierarchicalEntity, policy: ActionPolicies): void {
    for (const ancestor of subject.ancestors) {
      if (ancestor instanceof Context) {
        for (const ancestorRole of ancestor.roles || []) {
          const ancestorRoleAccessPolicy = this.getAndEnsureSubjectRoleAccessPolicy(ancestor, ancestorRole, subject);
          if (!ancestorRoleAccessPolicy.has(role.name)) {
            ancestorRoleAccessPolicy.set(role.name, policy);
          }
        }
      }
    }
  }

  /**
   * Sets the access policy for the subject role.
   * @param {SubjectRoleAccessPolicies} accessPolicy - The access policy map.
   * @param {Context} subject - The subject entity.
   * @param {Object} policy - The access policy object.
   * @returns {void}
   */
  setSubjectRolePermissions(accessPolicy: SubjectRoleAccessPolicies, subject: HierarchicalEntity, policy: ActionPolicies): void {
    if (subject instanceof Context) {
      for (const subjectRole of subject.roles) {
        if (!accessPolicy.has(subjectRole.name)) {
          accessPolicy.set(subjectRole.name, policy);
        }
      }
    }
  }

  /**
   * Sets the access policy for the null role.
   * @param {SubjectRoleAccessPolicies} accessPolicy - The access policy map.
   * @param {Object} policy - The access policy object.
   * @returns {void}
   */
  setAccessPolicyForNullRole(accessPolicy: SubjectRoleAccessPolicies, policy: ActionPolicies): void {
    if (!accessPolicy.has(null)) {
      accessPolicy.set(null, policy);
    }
  }

  /**
   * Gets and ensures the access policy for a given context, context role, and subject.
   * If the access policy does not exist, it initializes it.
   * @param {Context} context - The context entity.
   * @param {Role} contextRole - The role within the context.
   * @param {HierarchicalEntity} subject - The subject entity.
   * @returns {SubjectRoleAccessPolicies} The access policy for the given subject.
   */
  getAndEnsureSubjectRoleAccessPolicy(context: Context, contextRole: Role, subject: HierarchicalEntity): SubjectRoleAccessPolicies {
    // Ensure the context has an access policy map
    let contextRoleAccessPolicy: ContextRoleAccessPolicies | undefined = this.definedAccessPolicies.get(context.name);
    if (!contextRoleAccessPolicy) {
      contextRoleAccessPolicy = new Map<string, ContextRoleAccessPolicies>();
      this.definedAccessPolicies.set(context.name, contextRoleAccessPolicy);
    }

    // Ensure the context role has an access policy map
    let subjectAccessPolicy: SubjectAccessPolicies | undefined = contextRoleAccessPolicy.get(contextRole.name);
    if (!subjectAccessPolicy) {
      subjectAccessPolicy = new Map<string, SubjectAccessPolicies>();
      contextRoleAccessPolicy.set(contextRole.name, subjectAccessPolicy);
    }

    // Ensure the subject has an access policy map
    let subjectRoleAccessPolicy: SubjectRoleAccessPolicies | undefined = subjectAccessPolicy.get(subject.name);
    if (!subjectRoleAccessPolicy) {
      subjectRoleAccessPolicy = new Map<string | null, ActionPolicies>();
      subjectAccessPolicy.set(subject.name, subjectRoleAccessPolicy);
    }

    // Return the access policy map for the subject
    return subjectRoleAccessPolicy;
  }
}

/**
 * Represents a PermissionsTree object.
 */
export class PermissionsTree {
  /**
   * Unique identifier (UID) for the PermissionsTree instance.
   * @type {string}
   */
  UID: string;

  /**
   * Set to hold instances of PermissionsTree and its subclasses.
   * @type {Set<Role>}
   * @static
   */
  static instances: Set<PermissionsTree> = new Set();

  /**
   * A Map containing instances of PermissionsTree, with the entity's name as the key.
   * Used to efficiently retrieve instances by name.
   * @type {Map<string, PermissionsTree>}
   */
  static instanceMap: Map<string, PermissionsTree> = new Map();

  /**
   * Name of the PermissionsTree
   * @type {string}
   */
  name: string;

  /**
   * Map of entity names that hold a Set of controller names
   * @type: {Map<string, Set<string>>}
   */
  controllers: Map<string, Set<string>> = new Map();

  /**
   * Map of entities
   * @type: {Map<string, Set<string>>}
   */
  entities: Map<string, HierarchicalEntity> = new Map();

  /**
   * relationships between hierarchical entities
   * @type: {Relationships}
   */
  relationships: Relationships = {};

  /**
   * Hierachy of entities
   * @type: {Hierachy}
   */
  hierarchy: Hierachy = {};

  /**
   * Tree of hierachical entities
   * @type: {Leave[]}
   */
  tree: Leave[] = [];

  /**
   * Creates an instance of PermissionsTree.
   * Initializes the UID property with a unique identifier.
   */
  constructor(name: string) {
    this.UID = generateUID();
    this.name = name;
    this.registerInstance();
    this.buildTree();
  }

  /**
   * Registers an instance with the set and throws an error if an instance with the same name already exists.
   * @throws {Error} - If an instance with the same name already exists.
   * @returns {void}
   */
  private registerInstance(): void {
    if (PermissionsTree.instanceMap.has(this.name)) {
      throw new Error(`PermissionsTree instance with name '${this.name}' already exists.`);
    }

    PermissionsTree.instances.add(this);
    PermissionsTree.instanceMap.set(this.name, this);
  }

  /**
   * Builds a hierarchical tree based on the relationships between instances.
   * This method retrieves relationships between instances, constructs a hierarchy
   * from those relationships, and then builds a hierarchical tree based on the constructed hierarchy.
   * @returns {void}
   */
  buildTree(): void {
    this.buildControllers(HierarchicalEntity.instances);
    this.buildEntities(HierarchicalEntity.instances);

    this.relationships = getEntityRelationships(HierarchicalEntity.instances);
    this.hierarchy = getHierarchy(this.relationships);
    this.tree = getHierarchicalTree(this.hierarchy);
  }

  /**
   * Builds a map of entities from the given set of entities.
   * The map keys are the names of the entities, and the values are the entities themselves.
   * @param {Set<HierarchicalEntity>} entities - The set of entities to be mapped.
   * @returns {void}
   */
  buildEntities(entities: Set<HierarchicalEntity>): void {
    this.entities = new Map([...entities].map((entity) => [entity.name, entity]));
  }

  /**
   * Builds controller references for the given entities.
   * @param {Set<HierarchicalEntity>} entities - The entities for which controller references are to be built.
   * @returns {void}
   */
  buildControllers(entities: Set<HierarchicalEntity>): void {
    for (const entity of entities) {
      // Initialize a Set for controller name references if not already present
      if (!this.controllers.has(entity.name)) {
        this.controllers.set(entity.name, new Set());
      }

      // Add controller name references for each controller entity
      for (const controller of entity.controllers) {
        this.controllers.get(entity.name)?.add(controller.name);
      }
    }
  }
}

/**
 * Represents a PermissionManager object.
 */
export class PermissionManager {
  /**
   * Unique identifier (UID) for the PermissionManager instance.
   * @type {string}
   */
  UID: string;

  /**
   * Set to hold instances of PermissionManager and its subclasses.
   * @type {Set<PermissionManager>}
   * @static
   */
  static instances: Set<PermissionManager> = new Set();

  /**
   * A Map containing instances of PermissionManager, with the entity's name as the key.
   * Used to efficiently retrieve instances by name.
   * @type {Map<string, PermissionManager>}
   */
  static instanceMap: Map<string, PermissionManager> = new Map();

  /**
   * Represents the membership adapter used to adapt custom membership formats to the expected Membership format.
   * This property is static and can be assigned an instance of a class that implements the MembershipAdapter interface.
   * When assigned, the membership adapter is automatically registered with PermissionManager.
   * @type {MembershipAdapter | undefined}
   */
  static membershipAdapter: MembershipAdapter | undefined;

  /**
   * Represents the subject adapter used to adapt custom subject formats to the expected Subject format.
   * This property is static and can be assigned an instance of a class that implements the SubjectAdapter interface.
   * When assigned, the subject adapter is automatically registered with PermissionManager.
   * @type {SubjectAdapter | undefined}
   */
  static subjectAdapter: SubjectAdapter | undefined;

  /**
   * Name of the PermissionManager
   * @type {string}
   */
  name: string;

  /**
   * Initiate a new permissions tree
   * @type {PermissionsTree}
   */
  permissionsTree: PermissionsTree;

  /**
   * Initiate new access policies
   * @type {AccessPolicies}
   */
  accessPolicies: AccessPolicies;

  /**
   * Creates an instance of PermissionManager.
   * Initializes the UID property with a unique identifier.
   */
  constructor(name: string) {
    this.UID = generateUID();
    this.name = name;
    this.registerInstance();
    this.permissionsTree = new PermissionsTree(`${this.name}PermissionsTree`);
    this.accessPolicies = new AccessPolicies(`${this.name}AccessPolicies`);
  }

  /**
   * Registers an instance with the set and throws an error if an instance with the same name already exists.
   * @throws {Error} - If an instance with the same name already exists.
   * @returns {void}
   */
  private registerInstance(): void {
    if (PermissionManager.instanceMap.has(this.name)) {
      throw new Error(`PermissionManager instance with name '${this.name}' already exists.`);
    }

    PermissionManager.instances.add(this);
    PermissionManager.instanceMap.set(this.name, this);
  }

  /**
   * Retrieves the action policy key and access policy keys for a given action and subject.
   * @param {Membership[]} memberships - The array of membership objects.
   * @param {string} action - The action for which permission is being checked.
   * @param {Subject} subject - The subject for which permission is being checked.
   * @returns {object} An object containing the action policy key and the set of access policy keys.
   */
  private getPermissionPolicyKeySet(
    memberships: Membership[],
    action: string,
    subject: Subject,
  ): { actionPolicyKey: string; accessPolicyKeys: Set<string> } {
    // Initialize subject membership
    let subjectMembership: Membership | undefined;

    // Group memberships by contextName and contextKey
    const groupedMemberships = new Map<string, Map<string, Membership>>();
    for (const membership of memberships) {
      if (!groupedMemberships.has(membership.contextName)) {
        groupedMemberships.set(membership.contextName, new Map<string, Membership>());
      }
      groupedMemberships.get(membership.contextName)?.set(membership.contextKey, membership);

      // Check if the membership matches the subject
      if (membership.contextName === subject.name && membership.contextKey === subject.key) {
        subjectMembership = membership;
      }
    }

    // Get the subject entity
    const subjectEntity = HierarchicalEntity.instanceMap.get(subject.name);

    // Initialize array to store context memberships
    const contextMemberships: Membership[] = [];
    if (subjectMembership) {
      contextMemberships.push(subjectMembership);
    }

    // Initialize object to store ancestors
    let ancestors: { [entityName: string]: string | null | undefined } = {};

    // Iterate through the subject's sorted ancestors
    for (const ancestor of subjectEntity?.descSortedAncestors || []) {
      const ancestorKey = subject.ancestors[ancestor.name] || ancestors[ancestor.name];

      if (ancestorKey) {
        // Retrieve membership from grouped memberships
        const membership = groupedMemberships.get(ancestor.name)?.get(ancestorKey);
        if (membership) {
          contextMemberships.push(membership);
          ancestors = { ...ancestors, ...membership.ancestors };
        }
      }
    }

    // Generate access policy keys based on context memberships
    const accessPolicyKeys = new Set(
      contextMemberships.map(
        (membership) => `${membership.contextName}-${membership.roleName}-${subject.name}-${subjectMembership?.roleName || 'null'}`,
      ),
    );

    // Generate the action policy key
    const actionPolicyKey = `${subject.name}-${action}`;

    return {
      actionPolicyKey,
      accessPolicyKeys,
    };
  }

  /**
   * Retrieves the access policy keys and controller access policy keys for a given subject.
   * @param {Membership[]} memberships - The array of membership objects.
   * @param {Subject} subject - The subject for which permission is being checked.
   * @returns {object} An object containing the access policy keys and the controller access policy keys.
   */
  private getActorPolicyKeySet(
    memberships: Membership[],
    subject: Subject,
  ): { accessPolicyKeys: Set<string>; controllerAccessPolicyKeys: Set<string> } {
    // Initialize variables
    let subjectMembership: Membership | undefined;

    // Group memberships by contextName and contextKey
    const groupedMemberships = new Map<string, Map<string, Membership>>();
    for (const membership of memberships) {
      if (!groupedMemberships.has(membership.contextName)) {
        groupedMemberships.set(membership.contextName, new Map<string, Membership>());
      }
      groupedMemberships.get(membership.contextName)?.set(membership.contextKey, membership);

      // Check if the membership matches the subject
      if (membership.contextName === subject.name && membership.contextKey === subject.key) {
        subjectMembership = membership;
      }
    }

    // Get the subject entity
    const subjectEntity = HierarchicalEntity.instanceMap.get(subject.name);

    // Initialize contextMemberships array
    const contextMemberships: Membership[] = [];
    if (subjectMembership) {
      contextMemberships.push(subjectMembership);
    }

    // Initialize object to store ancestors
    let ancestors: { [entityName: string]: string | null | undefined } = {};
    const ancestorMemberships = new Set<Membership>();

    // Iterate through the subject's sorted ancestors
    for (const ancestor of subjectEntity?.descSortedAncestors || []) {
      const ancestorKey = subject.ancestors[ancestor.name] || ancestors[ancestor.name];

      if (ancestorKey) {
        // Retrieve membership from grouped memberships
        const membership = groupedMemberships.get(ancestor.name)?.get(ancestorKey);

        if (membership) {
          contextMemberships.push(membership);
          ancestorMemberships.add(membership);
          ancestors = { ...ancestors, ...membership.ancestors };
        }
      }
    }

    // Generate controller access policy keys based on subject and ancestor memberships
    const controllerAccessPolicyKeys = new Set<string>();
    for (const controller of subjectEntity?.controllers || []) {
      const controllerKey = `${controller.name}-null`;
      if (subjectMembership) {
        controllerAccessPolicyKeys.add(`${subjectMembership.contextName}-${subjectMembership.roleName}-${controllerKey}`);
      }
      for (const membership of ancestorMemberships) {
        controllerAccessPolicyKeys.add(`${membership.contextName}-${membership.roleName}-${controllerKey}`);
      }
    }

    // Generate access policy keys based on context memberships
    const accessPolicyKeys = new Set(
      contextMemberships.map(
        (membership) => `${membership.contextName}-${membership.roleName}-${subject.name}-${subjectMembership?.roleName || 'null'}`,
      ),
    );

    return {
      accessPolicyKeys,
      controllerAccessPolicyKeys,
    };
  }

  /**
   * Checks if a permission is allowed based on the provided memberships, action, and subject.
   * @param {any[]} memberships - The array of membership objects. The structure of each membership object may vary depending on the provided adapter.
   * @param {string} action - The action for which permission is being checked.
   * @param {any} subject - The subject object for which permission is being checked. The structure of the subject object may vary depending on the provided adapter.
   * @returns {boolean} Returns true if the action is allowed, false if not allowed.
   */

  // biome-ignore lint/suspicious/noExplicitAny: The types of 'memberships' and 'subject' are dynamically converted by a possible adapter.
  isPermissionAllowed(memberships: any[], action: string, subject: any): boolean {
    // Adapt the subject if a subject adapter is provided
    const adaptedSubject: Subject = PermissionManager.subjectAdapter ? PermissionManager.subjectAdapter.adapt(subject) : subject;

    // Adapt the memberships if a membership adapter is provided
    const adaptedMemberships: Membership[] = PermissionManager.membershipAdapter
      ? PermissionManager.membershipAdapter.adapt(memberships)
      : memberships;

    // Check permission with the adapted memberships and subject
    return this.isPermissionAllowedInternal(adaptedMemberships, action, adaptedSubject);
  }

  /**
   * Checks if a permission is allowed based on the provided memberships, action, and subject.
   * @param {Membership[]} memberships - The array membership objects.
   * @param {string} action - The action for which permission is being checked.
   * @param {Subject} subject - The subject for which permission is being checked.
   * @returns {boolean} Returns true if the action is allowed, false if not allowed.
   */
  private isPermissionAllowedInternal(memberships: Membership[], action: string, subject: Subject): boolean {
    // Retrieve the action policy key and access policy keys for the provided action and subject
    const { actionPolicyKey, accessPolicyKeys } = this.getPermissionPolicyKeySet(memberships, action, subject);

    // If either the action policy key or access policy keys are not available, return false
    if (!actionPolicyKey || accessPolicyKeys.size === 0) {
      return false;
    }

    // Retrieve allowance for the action policy key
    const allowance = this.accessPolicies.allowance.get(actionPolicyKey);

    // If no allowance found for the action policy key, return false
    if (!allowance) {
      return false;
    }

    // Check if any of the access policy keys are allowed
    for (const accessPolicyKey of accessPolicyKeys) {
      if (allowance.has(accessPolicyKey)) {
        return true;
      }
    }

    // If none of the access policy keys are allowed, return false
    return false;
  }

  /**
   * Retrieves the action policies for an actor based on the provided memberships and subject.
   * @param {any[]} memberships - The array of membership objects. The structure of each membership object may vary depending on the provided adapter.
   * @param {any} subject - The subject object for which permission is being checked. The structure of the subject object may vary depending on the provided adapter.
   * @returns {ActionPolicies} The action policies for the actor.
   */

  // biome-ignore lint/suspicious/noExplicitAny: The types of 'memberships' and 'subject' are dynamically converted by a possible adapter.
  getActorPolicies(memberships: any[], subject: any): ActionPolicies {
    // Adapt the subject if a subject adapter is provided, otherwise use it directly
    const adaptedSubject: Subject = PermissionManager.subjectAdapter ? PermissionManager.subjectAdapter.adapt(subject) : subject;

    // Adapt the memberships if a membership adapter is provided, otherwise use them directly
    const adaptedMemberships: Membership[] = PermissionManager.membershipAdapter
      ? PermissionManager.membershipAdapter.adapt(memberships)
      : memberships;

    // Get actor policies based on the adapted memberships and subject
    return this.getActorPoliciesInternal(adaptedMemberships, adaptedSubject);
  }

  /**
   * Retrieves the action policies for an actor based on the provided memberships and subject.
   * @param {Membership[]} memberships - The array of membership objects.
   * @param {Subject} subject - The subject for which action policies are being retrieved.
   * @returns {ActionPolicies} The action policies for the actor.
   */
  private getActorPoliciesInternal(memberships: Membership[], subject: Subject): ActionPolicies {
    // Get access policy keys and controller access policy keys for the subject
    const { accessPolicyKeys, controllerAccessPolicyKeys } = this.getActorPolicyKeySet(memberships, subject);

    // Get the subject entity from the instance map
    const subjectEntity = HierarchicalEntity.instanceMap.get(subject.name);

    // Initialize the actor policies object
    const actorPolicies: ActionPolicies = {};

    // Check each action against the access policies
    for (const action of this.accessPolicies.actions) {
      const actionPolicyKey = `${subject.name}-${action}`;
      const allowance = this.accessPolicies.allowance.get(actionPolicyKey);

      // Determine if the action is allowed for the subject
      actorPolicies[action] = !!(allowance && doSetsHaveCommonElement(accessPolicyKeys, allowance));
    }

    // Check each controller action against the access policies
    for (const controller of subjectEntity?.controllers || []) {
      for (const action of this.accessPolicies.actions) {
        const actionPolicyKey = `${controller.name}-${action}`;
        const allowance = this.accessPolicies.allowance.get(actionPolicyKey);

        // Determine if the controller action is allowed for the subject
        if (allowance && doSetsHaveCommonElement(controllerAccessPolicyKeys, allowance)) {
          actorPolicies[`${controller.name}.${action}`] = true;
        }
      }
    }

    return actorPolicies;
  }
}
