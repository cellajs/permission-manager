import t from 'tap';

import {
    Context,
    HierarchicalEntity,
    Product,
    doSetsHaveCommonElement,
    generateUID,
    getEntityAncestors,
    getEntityRelationships,
    getHierarchicalTree,
    getHierarchy,
} from '../src/index.ts';

t.test('generateUID', (t) => {
    t.test('returns a string', (t) => {
        const uid = generateUID();
        t.type(uid, 'string', 'Return value should be a string');
        t.end();
    });
  
    t.test('returns a string with correct format', (t) => {
        const uid = generateUID();
        t.match(uid, /^[a-z0-9]+$/, 'Generated UID should match the format /^[a-z0-9]+$/');
        t.ok(uid.length >= 12, 'Generated UID should have a minimum length of 12');
        t.end();
    });
  
    t.test('returns unique values', (t) => {
        const uids = new Set<string>();
        const numTests = 1000;
        for (let i = 0; i < numTests; i++) {
        const uid = generateUID();
        t.notOk(uids.has(uid), 'Generated UID should be unique');
        uids.add(uid);
        }
        t.end();
    });

    t.end();
});

t.test('doSetsHaveCommonElement', (t) => {
    t.test('sets with common elements', (t) => {
        const set1 = new Set(['a', 'b', 'c']);
        const set2 = new Set(['b', 'd', 'e']);
        t.ok(doSetsHaveCommonElement(set1, set2), 'Sets with common elements should return true');
        t.end();
    });
      
    t.test('sets with no common elements', (t) => {
        const set1 = new Set(['a', 'b', 'c']);
        const set2 = new Set(['d', 'e', 'f']);
        t.notOk(doSetsHaveCommonElement(set1, set2), 'Sets with no common elements should return false');
        t.end();
    });
      
    t.test('one set is empty', (t) => {
        const set1 = new Set(['a', 'b', 'c']);
        const set2 = new Set();
        t.notOk(doSetsHaveCommonElement(set1, set2), 'One set being empty should always return false');
        t.end();
    });
    
    t.test('both sets are empty', (t) => {
        const set1 = new Set();
        const set2 = new Set();
        t.notOk(doSetsHaveCommonElement(set1, set2), 'Both sets being empty should return false');
        t.end();
    });

    t.end();
});

t.test('getEntityAncestors', (t) => {
    t.test('entity with no ancestors', (t) => {
        t.same(getEntityAncestors({}), [[]], 'Should return empty array for entity with no ancestors');
        t.end();
    });

    t.test('entity with ancestors', (t) => {
        const root = {};
        const parent = { parents: new Set([root]) };
        const child = { parents: new Set([parent]) };
        const leave = { parents: new Set([child]) };

        t.same(getEntityAncestors(leave), [[child, parent, root]], 'Should return ancestors');
        t.end();
    });
  
    t.test('entity with polyhierarchicaliple ancestors', (t) => {
        const root = {};
        const parent = { parents: new Set([root]) };
        const child = { parents: new Set([parent]) };
        const leave = { parents: new Set([child, parent]) };

        t.same(getEntityAncestors(leave), [[child, parent, root], [parent, root]], 'Should return polyhierarchical ancestors');
        t.end();
    });
    
    t.test('entity with circular references', (t) => {
        const root = {};
        const parent = { parents: new Set([root]) };
        const child = { parents: new Set([parent]) };
        const leave = { parents: new Set([child]) };
        root.parents = new Set([leave]);

        t.throws(() => getEntityAncestors(leave), 'Should throw error for entity with circular references');
        t.end();
    }); 

    t.end();
});

t.test('getEntityRelationships', (t) => {
    t.test('retrieve relationships for parentless entities', (t) => {
        const entities = new Set([{ name: 'rootA' }, { name: 'rootB' }]);

        const actualRelationships = getEntityRelationships(entities);
        const expectedRelationships = {
            rootA: {
                inheritsFrom: 'rootA',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            rootB: {
                inheritsFrom: 'rootB',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
        };
    
        t.same(actualRelationships, expectedRelationships, 'Relationships should be constructed without parent references');
        t.end();
    });

    t.test('retrieve relationships for entities with parents', (t) => {
        const root = { name: 'root', lowestHierarchyLevel: 1 };
        const parent = { name: 'parent', lowestHierarchyLevel: 2, parents: new Set([root]) };
        const child = { name: 'child', lowestHierarchyLevel: 3, parents: new Set([parent]) };
        const leave = { name: 'leave', lowestHierarchyLevel: 4, parents: new Set([child]) };

        const entities = new Set([root, parent, child, leave]);

        const actualRelationships = getEntityRelationships(entities);
        const expectedRelationships = {
            root: {
                inheritsFrom: 'root',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            parent: {
                inheritsFrom: 'parent',
                polyhierarchicalAncestors: [['root']],
                ancestors: [],
            },
            child: {
                inheritsFrom: 'child',
                polyhierarchicalAncestors: [['parent', 'root']],
                ancestors: [],
            },
            leave: {
                inheritsFrom: 'leave',
                polyhierarchicalAncestors: [['child', 'parent', 'root']],
                ancestors: [],
            },
        };
    
        t.same(actualRelationships, expectedRelationships, 'Relationships should be constructed with parent references');
        t.end();
    });

    t.test('retrieve relationships for entities with polyhierarchical ancestors', (t) => {
        const root = { name: 'root', lowestHierarchyLevel: 1 };
        const parent = { name: 'parent', lowestHierarchyLevel: 2, parents: new Set([root]) };
        const child = { name: 'child', lowestHierarchyLevel: 3, parents: new Set([parent]) };
        const leave = { name: 'leave', lowestHierarchyLevel: 4, parents: new Set([child, parent]) };

        const entities = new Set([root, parent, child, leave]);

        const actualRelationships = getEntityRelationships(entities);
        const expectedRelationships = {
            root: {
                inheritsFrom: 'root',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            parent: {
                inheritsFrom: 'parent',
                polyhierarchicalAncestors: [['root']],
                ancestors: [],
            },
            child: {
                inheritsFrom: 'child',
                polyhierarchicalAncestors: [['parent', 'root']],
                ancestors: [],
            },
            leave: {
                inheritsFrom: 'leave',
                polyhierarchicalAncestors: [['child', 'parent', 'root'], ['parent', 'root']],
                ancestors: [],
            },
        };
    
        t.same(actualRelationships, expectedRelationships, 'Relationships should be constructed with polyhierarchical parent references');
        t.end();
    });

    t.end();
});

t.test('getEntityRelationships', (t) => {
    t.test('retrieve hierarchy for relationships without ancestors', (t) => {
        const relationships = {
            rootA: {
                inheritsFrom: 'rootA',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            rootB: {
                inheritsFrom: 'rootB',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
        };
    
        const actualHierarchy = getHierarchy(relationships);
        const expectedHierarchy = {
            rootA: {},
            rootB: {},
        };
    
        t.same(actualHierarchy, expectedHierarchy, 'Hierarchy should be constructed without ancestor references');
        t.end();
    });

    t.test('retrieve hierarchy for relationships with ancestors', (t) => {
        const relationships = {
            root: {
                inheritsFrom: 'root',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            parent: {
                inheritsFrom: 'parent',
                polyhierarchicalAncestors: [['root']],
                ancestors: [],
            },
            child: {
                inheritsFrom: 'child',
                polyhierarchicalAncestors: [['parent', 'root']],
                ancestors: [],
            },
            leave: {
                inheritsFrom: 'leave',
                polyhierarchicalAncestors: [['child', 'parent', 'root']],
                ancestors: [],
            },
        };
    
        const actualHierarchy = getHierarchy(relationships);
        const expectedHierarchy = {
            root: {
                parent: {
                    child: {
                        leave: {}
                    }
                }
            },
        };
    
        t.same(actualHierarchy, expectedHierarchy, 'Hierarchy should be constructed with ancestor references');
        t.end();
    });

    t.test('retrieve hierarchy for relationships with polyhierarchical ancestors', (t) => {
        const relationships = {
            root: {
                inheritsFrom: 'root',
                polyhierarchicalAncestors: [[]],
                ancestors: [],
            },
            parent: {
                inheritsFrom: 'parent',
                polyhierarchicalAncestors: [['root']],
                ancestors: [],
            },
            child: {
                inheritsFrom: 'child',
                polyhierarchicalAncestors: [['parent', 'root']],
                ancestors: [],
            },
            leave: {
                inheritsFrom: 'leave',
                polyhierarchicalAncestors: [['child', 'parent', 'root'], ['parent', 'root']],
                ancestors: [],
            },
        };
    
        const actualHierarchy = getHierarchy(relationships);
        const expectedHierarchy = {
            root: {
                parent: {
                    child: {
                        leave: {}
                    },
                    leave: {}
                }
            },
        };
    
        t.same(actualHierarchy, expectedHierarchy, 'Hierarchy should be constructed with polyhierarchical ancestor references');
        t.end();
    });

    t.end();
});

t.test('getEntityRelationships', (t) => {
    t.test('generate hierarchical tree from hierarchy without ancestors', (t) => {
        const hierarchy = {
            rootA: {},
            rootB: {},
        };
    
        const actualTree = getHierarchicalTree(hierarchy);
        const expectedTree = [
            { name: 'rootA', UID: actualTree?.[0]?.UID, level: 1, parentUID: actualTree?.[0]?.parentUID },
            { name: 'rootB', UID: actualTree?.[1]?.UID, level: 1, parentUID: actualTree?.[1]?.parentUID },
        ];
    
        t.same(actualTree, expectedTree, 'HierarchicalTree should have no parent references');
        t.end();
    });


    t.test('generate hierarchical tree from hierarchy with ancestors', (t) => {
        const hierarchy = {
            root: {
                parent: {
                    child: {
                        leave: {}
                    }
                }
            },
        };
    
        const actualTree = getHierarchicalTree(hierarchy);
        const expectedTree = [
            { name: 'root', UID: actualTree?.[0]?.UID, level: 1, parentUID: actualTree?.[0]?.parentUID },
            { name: 'parent', UID: actualTree?.[1]?.UID, level: 2, parentUID: actualTree?.[1]?.parentUID },
            { name: 'child', UID: actualTree?.[2]?.UID, level: 3, parentUID: actualTree?.[2]?.parentUID },
            { name: 'leave', UID: actualTree?.[3]?.UID, level: 4, parentUID: actualTree?.[3]?.parentUID },
        ];
    
        t.same(actualTree, expectedTree, 'HierarchicalTree should have parent references');
        t.end();
    });

    t.test('generate hierarchical tree from hierarchy with polyhierarchical ancestors', (t) => {
        const hierarchy = {
            root: {
                parent: {
                    child: {
                        leave: {}
                    },
                    leave: {}
                }
            },
        };
    
        const actualTree = getHierarchicalTree(hierarchy);
        const expectedTree = [
            { name: 'root', UID: actualTree?.[0]?.UID, level: 1, parentUID: actualTree?.[0]?.parentUID },
            { name: 'parent', UID: actualTree?.[1]?.UID, level: 2, parentUID: actualTree?.[1]?.parentUID },
            { name: 'child', UID: actualTree?.[2]?.UID, level: 3, parentUID: actualTree?.[2]?.parentUID },
            { name: 'leave', UID: actualTree?.[3]?.UID, level: 3, parentUID: actualTree?.[3]?.parentUID },
            { name: 'leave', UID: actualTree?.[4]?.UID, level: 4, parentUID: actualTree?.[4]?.parentUID },
        ];
    
        t.same(actualTree, expectedTree, 'HierarchicalTree should have polyhierarchical parent references');
        t.end();
    });

    t.end();
})

t.test('HierarchicalEntity', (t) => {
    t.test('constructor', (t) => {
      t.test('should create an instance with the correct properties', (t) => {
        const entityName = 'root';
        const parents = new Set();
  
        const entity = new HierarchicalEntity(entityName, parents);
  
        t.equal(entity.name, entityName, 'should have the correct name');
        t.equal(entity.parents.size, 0, 'should have no parents');
        t.equal(entity.lowestHierarchyLevel, 1, 'should have the lowest hierarchy level set to 1');
        t.ok(entity.UID, 'should have a UID');
        t.ok(HierarchicalEntity.instances.has(entity), 'should be registered in the instances set');
        t.equal(HierarchicalEntity.instanceMap.get(entityName), entity, 'should be registered in the instanceMap');
        t.end();
      });
      t.end();
    });
    t.end();
});

t.test('Context', (t) => {
    t.test('constructor', (t) => {
      t.test('should create a new context instance with roles', (t) => {
        const parent1 = new HierarchicalEntity('contextParent1');
        const parent2 = new HierarchicalEntity('contextParent2');
        const context = new Context('context1', ['role1', 'role2'], new Set([parent1, parent2]));
  
        t.equal(context.name, 'context1', 'should set the name correctly');
        t.equal(context.roles.size, 2, 'should have 2 roles');
        t.equal(context.parents.size, 2, 'should have 2 parents');
        t.equal(context.lowestHierarchyLevel, 2, 'should have the lowest hierarchy level set to 2');
        t.end();
      });
      t.end();
    });
    t.end();
});

t.test('Product', (t) => {
    t.test('constructor', (t) => {
      t.test('should create a new product instance', (t) => {
        const parent1 = new Context('productParent1', ['role1', 'role2']);
        const parent2 = new Context('productParent2', ['role1', 'role2']);
        const product = new Product('product1', new Set([parent1, parent2]));
  
        t.equal(product.name, 'product1', 'should set the name correctly');
        t.equal(product.parents.size, 2, 'should have 2 parents');
        t.equal(product.lowestHierarchyLevel, 2, 'should have the lowest hierarchy level set to 2');
        t.end();
      });
      t.end();
    });
    t.end();
});