// @flow
import Vector from "./Vector";
import AABB from "./AABB";
import Space from "./Space";

type Entity = {
  aABB: AABB,
  parent: ?SplitTree,
  position: Vector
};

let averageCollisions = 32.5;
const numSamples = 1000;

const updateAverageCollisions = count =>
  (averageCollisions += (count - averageCollisions) / numSamples);

export const logAverageCollisions = () => {
  console.log(averageCollisions);
};

export default class SplitTree {
  parent: ?SplitTree;
  entities: ?Array<Entity>;
  childs: ?Array<SplitTree>;
  aABB: AABB;
  constructor(
    space: ?Space,
    options?: {
      parent: SplitTree,
      direction: number
    }
  ) {
    if (options) {
      const { parent, direction } = options;
      if (!parent || (direction !== 0 && !direction))
        "Tried to construct SplitTree with no parent or no direction";
      this.parent = parent;
      this.aABB = this.parent.aABB.partition(direction);
    } else {
      if (!(space && space instanceof Space))
        throw new Error(
          "Tried to construct SplitTree with no parent and no space"
        );
      this.aABB = new AABB(space.originVector, space.extents);
    }
  }

  insert(entity: Entity) {
    if (!this.containsAABB(entity.aABB))
      throw new SplitTree.OutOfBoundInsert(this, entity);
    const containingPartitionIndex: number = this.containingPartitionIndex(
      entity.aABB
    );
    if (containingPartitionIndex === SplitTree.INDEX_NOT_FOUND) {
      this.ensureEntitiesIsDefined();
      if (!this.entities) throw new Error("ensureEntitiesIsDefined failed");
      this.entities.push(entity);
      entity.parent = this;
      return true;
    } else {
      this.ensureChildIsDefined(containingPartitionIndex);
      if (!this.childs || !this.childs[containingPartitionIndex])
        throw new Error("ensureChildIsDefined failed");
      return this.childs[containingPartitionIndex].insert(entity);
    }
  }

  reduceEntities(callback: () => mixed, result: any) {
    if (this.entities && this.hasEntities)
      result = this.entities.reduce(callback, result);
    if (this.childs && this.hasChilds)
      result = this.childs.reduce(
        (result, node) => node.reduceEntities(callback, result),
        result
      );
    return result;
  }

  someEntities(callback: () => mixed) {
    if (this.entities && this.hasEntities && this.entities.some(callback))
      return true;
    return this.childs && this.hasChilds
      ? this.childs.some(node => node.someEntities(callback))
      : false;
  }

  containingNodes(aABB: AABB) {
    const result = [];
    if (this.containsAABB(aABB)) result.push(this);
    if (this.hasChilds && this.childs)
      this.childs.forEach(child => result.push(...child.containingNodes(aABB)));
    return result;
  }

  containingNode(aABB: AABB) {
    if (!this.containsAABB(aABB))
      throw new Error("Called containingNode on node not containing aABB");
    const containingChild = this.containingChild(aABB);
    if (!containingChild) return this;
    else return containingChild.containingNode(aABB);
  }

  containingChild(aABB: AABB) {
    return (
      this.hasChilds &&
      !!this.childs &&
      this.childs.reduce((containingChild, child) => {
        if (containingChild !== null) return containingChild;
        if (child.containsAABB(aABB)) return child;
        else return null;
      }, null)
    );
  }

  __collideAABB(aABB: AABB, ignored: any) {
    let collisionCount = 0;
    const scanFunx = entity => {
      if (entity && entity !== ignored) {
        collisionCount += 1;
        return entity.aABB.collideAABB(aABB);
      }
    };
    const containingNode = this.containingNode(aABB);
    const result = containingNode.someEntities(scanFunx);
    if (result) return result;
    let iterator = containingNode.parent;
    while (iterator) {
      if (
        iterator.hasEntities &&
        iterator.entities &&
        iterator.entities.some(scanFunx)
      )
        return true;
      iterator = iterator.parent;
    }
    updateAverageCollisions(collisionCount);
  }

  collideAABB(aABB: AABB, ignored: any) {
    if (!this.root.containsAABB(aABB)) return false;
    else return this.root.__collideAABB(aABB, ignored);
  }

  collide(entity: Entity) {
    return this.collideAABB(entity.aABB, entity);
  }

  containingPartitionIndex(aABB: AABB): number {
    return this.aABB.partitions.reduce((index, partition, directionIndex) => {
      if (index === SplitTree.INDEX_NOT_FOUND && partition.containsAABB(aABB)) {
        return directionIndex;
      } else {
        return index;
      }
    }, SplitTree.INDEX_NOT_FOUND);
  }

  clean() {
    if (this.isRoot || this.hasEntities || this.hasChilds) return;
    const { parent } = this;
    if (!parent || !parent.childs || parent.ownChildsCount === 0)
      throw new Error("parent has no childs");
    const { childs: parentChilds } = parent;
    const index = parentChilds.indexOf(this);
    if (index === SplitTree.INDEX_NOT_FOUND) throw new Error();
    delete parentChilds[index];
    parent.clean();
  }

  detachEntity(entity: Entity) {
    this.assertHasEntity(entity, this.moveEntity);
    const { entities } = this;
    if (!entities) throw new Error();
    const index = entities.indexOf(entity);
    const detachedEntity = entities[index];
    entities[index].parent = null;
    delete entities[index];
    this.clean();
  }

  get ownEntitiesCount(): number {
    return this.entities
      ? Object.keys(
          (((this.entities: Array<Entity>): any): { [number]: Entity })
        ).length
      : 0;
  }

  get ownChildsCount(): number {
    return this.childs
      ? Object.keys(
          (((this.childs: Array<SplitTree>): any): { [number]: SplitTree })
        ).length
      : 0;
  }

  reinsert(entity: Entity, newPosition: Vector) {
    const treeRoot = this.root;
    this.detachEntity(entity);
    entity.position = newPosition;
    treeRoot.insert(entity);
  }

  moveEntity(entity: Entity, newPosition: Vector) {
    const newAABB = new AABB(newPosition, entity.aABB.extents);
    if (!this.root.containsAABB(newAABB)) return false;
    this.reinsert(entity, newPosition);
    return true;
  }

  ensureEntitiesIsDefined() {
    if (!this.entities) Object.defineProperty(this, "entities", { value: [] });
  }

  ensureChildsIsDefined() {
    if (!this.childs) Object.defineProperty(this, "childs", { value: [] });
  }

  ensureChildIsDefined(childIndex: number) {
    if (!this.hasChild(childIndex)) {
      this.ensureChildsIsDefined();
      const { childs } = this;
      if (!childs) throw new Error();
      childs[childIndex] = new SplitTree(null, {
        parent: this,
        direction: childIndex
      });
    }
  }

  forEach(func: any) {
    func(this);
    const { childs } = this;
    if (childs) childs.forEach(child => child.forEach(func));
  }

  some(func: any) {
    const result = func(this);
    if (result) return result;
    const { childs } = this;
    if (childs) return childs.some(child => child.some(func));
    else return false;
  }

  assertHasEntity(entity: Entity, func: any) {
    const { entities } = this;
    if (!entities || entities.indexOf(entity) === SplitTree.INDEX_NOT_FOUND)
      throw new SplitTree.EntityNotFound(this, entity, func);
  }

  directionOf(child: SplitTree) {
    const { childs } = this;
    if (!childs) throw new SplitTree.BranchFunctionOnLeaf(this.directionOf);
    return childs.indexOf(child);
  }

  containsAABB(aABB: AABB) {
    return this.aABB.containsAABB(aABB);
  }

  hasChild(childIndex: number) {
    const { childs } = this;
    return childs && childIndex in childs;
  }

  toString() {
    return `${this.aABB.min.length}DSplitTree${this.isRoot ? " root" : ""}${this
      .isLeaf
      ? " leaf"
      : " branch"}${this.hasEntities
      ? " hasEntities"
      : ""} { position: ${this.position.toString()}, size: ${this
      .size}, depth: ${this.depth} }`;
  }

  get size(): number {
    return this.aABB.extents.x;
  }

  get extents(): Vector {
    return this.aABB.extents;
  }

  get depth(): number {
    const { parent } = this;
    return parent ? parent.depth + 1 : 0;
  }

  get position(): Vector {
    return this.aABB.position;
  }

  get isLeaf(): boolean {
    return !this.hasChilds;
  }

  get isRoot(): boolean {
    return !this.parent;
  }

  get hasEntities(): boolean {
    return !!this.entities && this.ownEntitiesCount > 0;
  }

  get hasChilds(): boolean {
    return !!this.childs && this.ownChildsCount > 0;
  }

  get root(): SplitTree {
    let node = this;
    while (node.parent) node = node.parent;
    return node;
  }

  static get INDEX_NOT_FOUND(): number {
    return -1;
  }

  static cutFuncName(func) {
    return func.toString().split(" ")[0];
  }

  static get BranchFunctionOnLeaf() {
    return class BranchFunctionOnLeaf extends Error {
      constructor(func) {
        super(
          `Tried to execute the function ${SplitTree.cutFuncName(
            func
          )} on a leaf node`
        );
      }
    };
  }

  static get OutOfBoundInsert() {
    return class OutOfBoundInsert extends Error {
      constructor(node, entity) {
        super(
          `Tried to insert out-of-bound entity ${entity.toString()} in ${node.toString()}`
        );
      }
    };
  }

  static get EntityNotFound() {
    return class EntityNotFound extends Error {
      constructor(node, entity, func) {
        super(
          `Tried to execute ${SplitTree.cutFuncName(
            func
          )} on ${node.toString()} which does not contain entity ${entity.toString()}`
        );
      }
    };
  }
}
