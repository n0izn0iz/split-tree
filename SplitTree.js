"use strict";

import Vector from "./Vector";
import AABB from "./AABB";
import Space from "./Space";
//import Direction, { directions } from "td-direction";

export default class SplitTree {
  constructor(space = null, { parent = null, direction = null } = {}) {
    if (parent !== null) {
      if (direction === null)
        throw new Error(
          "Tried to construct SplitTree with a parent but no direction"
        );
      this.parent = parent;
      this.aABB = this.parent.aABB.quadrant(direction);
    } else {
      if (!(space && space instanceof Space))
        throw new Error(
          "Tried to construct SplitTree with no parent and no space"
        );
      this.aABB = new AABB(space.originVector);
    }
  }

  insert(entity) {
    if (!this.containsAABB(entity.aABB))
      throw new SplitTree.OutOfBoundInsert(this, entity);
    const containingChildIndex = this.containingChildIndex(entity.aABB);
    if (containingChildIndex === SplitTree.INDEX_NOT_FOUND) {
      this.ensureEntitiesIsDefined();
      this.entities.push(entity);
      entity.parent = this;
      return true;
    } else {
      this.ensureChildIsDefined(containingChildIndex);
      return this.childs[containingChildIndex].insert(entity);
    }
  }

  reduceEntities(callback, result) {
    if (this.hasEntities) result = this.entities.reduce(callback, result);
    if (this.hasChilds)
      result = this.childs.reduce(
        (result, node) => node.reduceEntities(callback, result),
        result
      );
    return result;
  }

  someEntities(callback) {
    if (this.hasEntities && this.entities.some(callback)) return true;
    return this.hasChilds
      ? this.childs.some(node => node.someEntities(callback))
      : false;
  }

  collidingChilds(aABB) {
    return this.childs.reduce((result, child) => {
      if (child && child.aABB.collideAABB(aABB)) result.push(child);
      return result;
    }, []);
  }

  collideAABB(aABB, ignored) {
    const scanFunx = ownEntity =>
      ownEntity === ignored ? false : ownEntity.aABB.collideAABB(aABB);
    if (!this.containsAABB(aABB)) return false;
    const containingChildIndex = this.containingChildIndex(aABB);
    if (containingChildIndex !== SplitTree.INDEX_NOT_FOUND) {
      if (this.hasEntities && this.entities.some(scanFunx)) return true;
      else
        return (
          this.hasChild(containingChildIndex) &&
          this.childs[containingChildIndex].collideAABB(aABB, ignored)
        );
    }
    const collidingChilds = this.collidingChilds(aABB);
    if (collidingChilds.length === 0)
      throw new Error("INDEX_NOT_FOUND while 0 collidingChilds");
    return collidingChilds.some(child => {
      return child.collideAABB(aABB, ignored);
    });
  }

  collide(entity) {
    return this.collideAABB(entity.aABB, entity);
  }

  containingChildIndex(aABB) {
    return directions.reduce((index, direction, directionIndex) => {
      const quadrant = this.aABB.quadrant(directionIndex);
      if (index === SplitTree.INDEX_NOT_FOUND && quadrant.containsAABB(aABB)) {
        return directionIndex;
      } else {
        return index;
      }
    }, SplitTree.INDEX_NOT_FOUND);
  }

  clean() {
    if (this.isRoot || this.hasEntities || this.hasChilds) return;
    const { parent } = this;
    const index = parent.childs.indexOf(this);
    if (index === SplitTree.INDEX_NOT_FOUND) throw new Error();
    delete parent.childs[index];
    parent.clean();
  }

  detachEntity(entity) {
    this.assertHasEntity(entity, this.moveEntity);
    const index = this.entities.indexOf(entity);
    const detachedEntity = this.entities[index];
    this.entities[index].parent = null;
    delete this.entities[index];
    this.clean();
  }

  reinsert(entity, newPosition) {
    const treeRoot = this.root;
    this.detachEntity(entity);
    entity.position = newPosition;
    treeRoot.insert(entity);
  }

  moveEntity(entity, newPosition) {
    const newAABB = new AABB({ position: newPosition, size: entity.size });
    if (!this.root.containsAABB(newAABB)) return false;
    this.reinsert(entity, newPosition);
    return true;
  }

  ensureEntitiesIsDefined() {
    if (!this.hasEntities && !this.entities)
      Object.defineProperty(this, "entities", { value: [] });
  }

  ensureChildsIsDefined() {
    if (this.isLeaf && !this.childs)
      Object.defineProperty(this, "childs", { value: [] });
  }

  ensureChildIsDefined(childIndex) {
    if (!this.hasChild(childIndex)) {
      this.ensureChildsIsDefined();
      this.childs[childIndex] = new SplitTree(this, childIndex);
    }
  }

  forEach(func) {
    func(this);
    if (this.hasChilds) this.childs.forEach(child => child.forEach(func));
  }

  branchOnly(func) {
    if (this.isLeaf) throw new SplitTree.BranchFunctionOnLeaf(func);
  }

  assertHasEntity(entity, func) {
    if (
      !this.hasEntities ||
      this.entities.indexOf(entity) === SplitTree.INDEX_NOT_FOUND
    )
      throw new SplitTree.EntityNotFound(this, entity, func);
  }

  directionOf(child) {
    this.branchOnly(this.directionOf);
    return this.childs.indexOf(child);
  }

  containsAABB(aABB) {
    return this.aABB.containsAABB(aABB);
  }

  hasChild(childIndex) {
    return this.hasChilds && childIndex in this.childs;
  }

  toString() {
    return `${this.aABB.min.length}DSplitTree${this.isRoot ? " root" : ""}${this
      .isLeaf
      ? " leaf"
      : " branch"}${this.hasEntities ? " hasEntities" : ""} { position: ${this
      .position}, size: ${this.size}, depth: ${this.depth} }`;
  }

  get size() {
    return this.aABB.size;
  }

  get depth() {
    return this.isRoot ? 0 : this.parent.depth + 1;
  }

  get position() {
    return this.aABB.position;
  }

  get isLeaf() {
    return !this.hasChilds;
  }

  get isRoot() {
    return !this.hasOwnProperty("parent");
  }

  get hasEntities() {
    return (
      this.hasOwnProperty("entities") && Object.keys(this.entities).length > 0
    );
  }

  get hasChilds() {
    return this.hasOwnProperty("childs") && Object.keys(this.childs).length > 0;
  }

  get root() {
    let node = this;
    while (!node.isRoot) node = node.parent;
    return node;
  }

  static get INDEX_NOT_FOUND() {
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
        super(`Tried to insert out-of-bound entity ${entity} in ${node}`);
      }
    };
  }

  static get EntityNotFound() {
    return class EntityNotFound extends Error {
      constructor(node, entity, func) {
        super(
          `Tried to execute ${SplitTree.cutFuncName(
            func
          )} on ${node} which does not contain entity ${entity}`
        );
      }
    };
  }
}
