/**
 *  Copyright (C) 2014 3D Repo Ltd
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export class TreeService {

	public static $inject: string[] = [
		"$q",
		"APIService",
		"ViewerService",
	];

	public highlightSelectedViewerObject;
	public highlightMap;
	public highlightMapUpdateTime;
	public selectionDataUpdateTime;
	public visibilityUpdateTime;
	public selectedIndex;
	public treeReady;

	private state;
	private treeMap = null;
	private idToMeshes;
	private baseURL;

	private allNodes;
	private currentSelectedNodes;
	private clickedHidden;
	private clickedShown;
	private nodesToShow;
	private subTreesById;
	private subModelIdToPath;
	private idToNodeMap;
	private shownByDefaultNodes;
	private hiddenByDefaultNodes;
	private treeMapReady;
	private generatedMaps;
	private ready;

	constructor(
		private $q: ng.IQService,
		private APIService,
		private ViewerService,
	) {
		this.reset();

	}

	public reset() {

		this.ready = this.$q.defer();
		this.treeReady = this.$q.defer();
		this.treeMapReady = this.$q.defer();
		this.generatedMaps = null;

		this.state = {};
		this.state.idToPath = {};
		this.state.hideIfc = true;
		this.allNodes = [];
		this.currentSelectedNodes = [];
		this.clickedHidden = {}; // or reset?
		this.clickedShown = {}; // or reset?
		this.nodesToShow = [];
		this.subTreesById = {};
		this.subModelIdToPath = {};
		this.highlightMapUpdateTime = Date.now();
		this.highlightSelectedViewerObject = true;
	}

	public onReady() {
		return this.ready.promise;
	}

	/**
	 * @param value	True if OBJECT_SELECTED should be handled by component
	 */
	public setHighlightSelected(value: boolean) {
		this.highlightSelectedViewerObject = value;
	}



	public genIdToObjRef(tree: any, map: any) {

		if (!map) {
			map = {};
		}

		map[tree._id] = tree;

		if (tree.children) {
			tree.children.forEach((child) => {
				this.genIdToObjRef(child, map);
			});
		}

		return map;
	}

	public init(account: string, model: string, branch: string, revision: string, setting: any) {
		this.treeMap = null;
		branch = branch ? branch : "master";

		// revision = revision ? revision : "head";

		if (!revision) {
			this.baseURL = account + "/" + model + "/revision/master/head/";
		} else {
			this.baseURL = account + "/" + model + "/revision/" + revision + "/";
		}

		const url = this.baseURL + "fulltree.json";

		const meshesAndTrees = [
			this.getIdToMeshes(),
			this.getTrees(url, setting),
		];

		return Promise.all(meshesAndTrees)
			.then((meshAndTreeData) => {
				const tree = meshAndTreeData[1];
				this.setAllNodes([tree.nodes]);
				this.setSubTreesById(tree.subTreesById);
				this.setCachedIdToPath(tree.idToPath);
				this.setSubModelIdToPath(tree.subModelIdToPath);
				return this.getMap().then(() => {
					this.ready.resolve(tree);
					return tree;
				});
			})
			.catch((error) => {
				console.error("Error resolving tree(s): ", error);
			});

	}

	public getIdToMeshes() {

		const url = this.baseURL + "idToMeshes.json";
		const options = {
			headers: {
				"Content-Type": "application/json",
			},
		};

		return this.APIService.get(url, options)
			.then((json) => {
				this.idToMeshes = json.data.idToMeshes;
			})
			.catch((error) => {
				console.error("Failed to get Id to Meshes:", error);
			});

	}

	public getTrees(url: string, setting: any) {

		return this.APIService.get(url, {
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((json) => {

				const mainTree = json.data.mainTree;

				// TODO: This needs sorting out.

				// replace model id with model name in the tree if it is a federate model
				if (setting.federate) {

					mainTree.nodes.name = setting.name;
					mainTree.nodes.children.forEach((child) => {
						const name = child.name.split(":");
						const subModel = setting.subModels.find((m) => {
							return m.model === name[1];
						});

						if (subModel) {
							name[1] = subModel.name;
							child.name = name.join(":");
						}

						if (subModel && child.children && child.children[0]) {
							child.children[0].name = subModel.name;
						}
					});

				}

				const subTrees = json.data.subTrees;
				const subTreesById = {};

				return this.handleIdToPath(mainTree, subTrees, subTreesById);
			})
			.catch((error) => {
				console.error("Tree Init Error:", error);
				this.reset();
			});
	}

	public handleIdToPath(mainTree, subTrees, subTreesById) {
		return this.getIdToPath()
				.then((idToPath) => {

					const awaitedSubTrees = [];

					if (idToPath && idToPath.treePaths) {

						mainTree.idToPath = idToPath.treePaths.idToPath;

						if (subTrees) {

							// idToObjRef only needed if model is a fed model.
							// i.e. subTrees.length > 0

							mainTree.subModelIdToPath = {};

							subTrees.forEach((subtree) => {

								const subtreeIdToPath = idToPath.treePaths.subModels.find((submodel) => {
									return subtree.model === submodel.model;
								});

								if (subtreeIdToPath) {
									subtree.idToPath = subtreeIdToPath.idToPath;
								}

								this.handleSubTree(
									subtree,
									mainTree,
									subTreesById,
									awaitedSubTrees,
								);
							});
						}

					}

					mainTree.subTreesById = subTreesById;

					return Promise.all(awaitedSubTrees).then(() => {
						this.treeReady.resolve(mainTree);
						return mainTree;
					});

				})
				.catch((error) => {
					console.error("Error getting getIdToPath", error);
					this.reset();
				});

	}

	public getIdToPath() {

		const url = this.baseURL + "tree_path.json";
		return this.APIService.get(url, {
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				return response.data;
			});

	}

	public handleSubTree(subtree: any, mainTree: any, subTreesById: any, awaitedSubTrees: any[]) {

		const treeId = subtree._id;
		const idToObjRef = this.genIdToObjRef(mainTree.nodes, undefined);

		// attach the sub tree back on main tree
		if (idToObjRef[treeId] && subtree.url) {

			const getSubTree = this.APIService.get(subtree.url)
				.then((res) => {

					this.attachStatus(res, subtree, idToObjRef);

					subtree.buf = res.data.mainTree;

					const subTree = subtree.buf.nodes;
					const subTreeId = subTree._id;

					subTree.parent = idToObjRef[treeId];

					// Correct main tree using incoming subtree for federation
					const nodeIdsToUpdate = subTree.parent.path.split("__");

					for (let i = nodeIdsToUpdate.length - 1; i >= 0; i--) {
						const nodeToUpdate = idToObjRef[nodeIdsToUpdate[i]];

						if (nodeToUpdate.children) {
							this.updateParentVisibilityByChildren(nodeToUpdate);
						} else if (nodeIdsToUpdate.length - 1 === i) {
							nodeToUpdate.toggleState = subTree.toggleState;
						}
					}

					Object.assign(mainTree.subModelIdToPath, subtree.idToPath);

					idToObjRef[treeId].children = [subTree];
					idToObjRef[treeId].hasSubModelTree = true;
					subTreesById[subTreeId] = subTree;

				})
				.catch((res) => {
					this.attachStatus(res, subtree, idToObjRef);
					console.warn("Subtree issue: ", res);
				});

			awaitedSubTrees.push(getSubTree);

		}

	}

	public attachStatus(res: any, tree: any, idToObjRef: any) {
		if (res.status === 401) {
			tree.status = "NO_ACCESS";
		}

		if (res.status === 404) {
			tree.status = "NOT_FOUND";
		}

		if (tree.status) {
			idToObjRef[tree._id].status = tree.status;
		}
	}

	public search(searchString: string, revision: string) {
		let url;
		if (!revision) {
			url = `${this.baseURL}searchtree.json?searchString=${searchString}`;
		} else {
			url = `${this.baseURL}searchtree.json?searchString=${searchString}&rev=${revision}`;
		}
		return this.APIService.get(url);
	}

	public genMap(leaf: any, items: any) {

		const leafId = leaf._id;
		const sharedId = leaf.shared_id;

		if (leaf) {

			if (leaf.children) {
				leaf.children.forEach((child) => {
					this.genMap(child, items);
				});
			}
			items.uidToSharedId[leafId] = sharedId;
			items.sharedIdToUid[sharedId] = leafId;
			if (leaf.meta) {
				items.oIdToMetaId[leafId] = leaf.meta;
			}
		}

		return items;

	}

	public getMap() {

		// only do this once!
		if (!this.generatedMaps) {
			this.treeReady.promise.then((tree) => {
				this.treeMap = {
					oIdToMetaId: {},
					sharedIdToUid: {},
					uidToSharedId: {},
				};
				this.treeMap.idToMeshes = this.idToMeshes;
				this.generatedMaps = this.genMap(tree.nodes, this.treeMap);
				this.treeMapReady.resolve(this.generatedMaps);
			});
		}

		return this.treeMapReady.promise;

	}

	public getCurrentSelectedNodes() {
		return this.currentSelectedNodes;
	}

	public setCurrentSelectedNodes(nodes) {
		this.currentSelectedNodes = nodes;
	}

	public getClickedHidden() {
		return this.clickedHidden;
	}

	public resetClickedHidden() {
		this.clickedHidden = {};
	}

	public getClickedShown() {
		return this.clickedShown;
	}

	public resetClickedShown() {
		this.clickedShown = {};
	}

	public getNodesToShow() {
		return this.nodesToShow;
	}

	public getSubTreesById() {
		return this.subTreesById;
	}

	public getMeshId(nodeId: string) {
		let meshId = this.idToMeshes[nodeId];

		if (meshId !== undefined) {
			return meshId;
		}

		for (const key in this.idToMeshes) {
			if (key) {
				const potentialMeshId = this.idToMeshes[key][nodeId];
				if (potentialMeshId !== undefined) {
					meshId = potentialMeshId;
					return meshId;
				}
			}
		}

		return meshId;

 	}	 	

	public setSubTreesById(value) {
		this.subTreesById = value;
	}

	public getCachedIdToPath() {
		return this.state.idToPath;
	}

	public setCachedIdToPath(value) {
		this.state.idToPath = value;
	}

	public setSubModelIdToPath(value) {
		this.subModelIdToPath = value;
	}

	/**
	 * Initialise the tree nodes to show to the first node.
	 * @param nodes	Array of root node to show.
	 */
	public initNodesToShow(nodes) {
		// TODO: Is it a good idea to save tree state within each node?
		this.nodesToShow = nodes;
		this.nodesToShow[0].level = 0;
		this.nodesToShow[0].expanded = false;
		this.nodesToShow[0].selected = false;
		this.nodesToShow[0].hasChildren = this.nodesToShow[0].children;
	}

	/**
	 * Show the first set of children using the expand function but deselect the child used for this.
	 */
	public expandFirstNode() {
		this.toggleNodeExpansion(null, this.nodesToShow[0]._id);
	}

	public getAccountModelKey(account: string, model: string) {
		return account + "@" + model;
	}

	/**
	 * Add all child id of a node recursively, the parent node's id will also be added.
	 */
	public traverseNodeAndPushId(node: any, highlightMap: any, idToMeshes: any, colour?: number[]) {

		if (!node) {
			console.error("traverseNodeAndPushId node is null: ", node);
			return;
		}

		if (!idToMeshes) {
			console.error("traverseNodeAndPushId - idToMeshes is not defined: ", idToMeshes);
			return;
		}
		

		const model = node.model || node.project;
		const key = this.getAccountModelKey(node.account, model);

		if (!highlightMap[key]) {
			highlightMap[key] = {};
		}
		
		if (colour) {
			highlightMap[key].colour = colour
		}

		// Add the meshes
		let meshes = idToMeshes[node._id];

		// the node is within a sub model
		if (key && idToMeshes[key]) {
			meshes = idToMeshes[key][node._id];
		}
		if (meshes) {
			if (!highlightMap[key].meshes) {
				highlightMap[key].meshes = meshes;
			} else {
				highlightMap[key].meshes = highlightMap[key].meshes.concat(meshes);
			}
		} else if (node.children) {
			// This should only happen in federations.
			// Traverse down the tree to find submodel nodes
			node.children.forEach((child) => {
				this.traverseNodeAndPushId(child, highlightMap, idToMeshes, colour);
			});
		}

	}

	/**
	 * Helper function for updateParentVisibility which updates toggleState for given node only.
	 * @param node	Node to update.
	 */
	public updateParentVisibilityByChildren(node: any) {
		if (node.children) {
			let visibleChildCount = 0;
			let parentOfInvisibleChildCount = 0;

			for (let i = 0; 0 === parentOfInvisibleChildCount && node.children && i < node.children.length; i++) {
				switch (node.children[i].toggleState) {
					case "visible":
						visibleChildCount++;
						break;
					case "parentOfInvisible":
						parentOfInvisibleChildCount++;
						break;
				}
			}

			if (parentOfInvisibleChildCount > 0) {
				node.toggleState = "parentOfInvisible";
			} else if (node.children.length === visibleChildCount) {
				node.toggleState = "visible";
			} else if (0 === visibleChildCount) {
				node.toggleState = "invisible";
				this.setNodeSelection(node, false);
			} else {
				node.toggleState = "parentOfInvisible";
			}
		}
	}

	/**
	 * Update toggleState of given node based on its children and
	 * traverse up the tree if necessary and call updateModelVisibility
	 * @param node	Node to update.
	 */
	public updateParentVisibility(node: any) {

		const nodes = [node];

		while (nodes && nodes.length > 0) {
			const currentNode = nodes.pop();

			// Store the state before it's potentially changed
			// by updateParentVisibility
			const priorToggleState = currentNode.toggleState;

			this.updateParentVisibilityByChildren(currentNode);

			if (priorToggleState !== currentNode.toggleState || this.isLeafNode(currentNode)) {
				const path = this.getPath(currentNode._id);

				if (path && path.length > 1) {
					// Fast forward up path for parentOfInvisible state
					if ("parentOfInvisible" === currentNode.toggleState) {
						for (let i = path.length - 2; i >= 0; i--) {
							const parentNode = this.getNodeById(path[i]);
							parentNode.toggleState = "parentOfInvisible";
						}
					} else {
						nodes.push(this.getNodeById(path[path.length - 2]));
					}
				}
			}
		}

	}

	/**
	 * Toggle a node to expand or collapse it
	 * @param event the click event
	 * @param nodeId the id of the node to toggle
	 */
	public toggleNodeExpansion(event: any, nodeId: string) {

		if (event) {
			event.stopPropagation();
		}

		const nodeToExpand = this.getNodeById(nodeId);

		// Find node index
		const nodeIndex = this.nodesToShow.indexOf(nodeToExpand);

		if (nodeIndex !== -1 && nodeToExpand.children && nodeToExpand.children.length > 0) {
			if (nodeToExpand.expanded) {
				this.collapseTreeNode(nodeToExpand);
			} else {
				this.expandTreeNode(nodeToExpand);
			}
		}
	}

	/**
	* Collapse a given tree node in the UI
	* @param nodeToCollapse the node to collapse
	*/
	public collapseTreeNode(nodeToCollapse: any) {

		let subNodes = [];
		if (nodeToCollapse.children) {
			subNodes = subNodes.concat(nodeToCollapse.children);
		}

		nodeToCollapse.expanded = false;

		while (subNodes.length > 0) {

			const subNodeToCollapse = subNodes.pop();

			// Collapse the node
			if (subNodeToCollapse.expanded) {
				// If it has children lets collapse those too
				if (subNodeToCollapse.children) {
					subNodes = subNodes.concat(subNodeToCollapse.children);
				}
				subNodeToCollapse.expanded = false;
			}

			// Remove the node from the visible tree
			const subNodeToCollapseIndex = this.nodesToShow.indexOf(subNodeToCollapse);

			if (subNodeToCollapseIndex !== -1) {
				this.nodesToShow.splice(subNodeToCollapseIndex, 1);
			}
		}
	}

	/**
	 * Expand a given tree node in the UI
	 * @param nodeToExpand the path array to traverse down
	 */
	public expandTreeNode(nodeToExpand: any) {

		if (nodeToExpand.children && nodeToExpand.children.length > 0) {
			const nodeToExpandIndex = this.nodesToShow.indexOf(nodeToExpand);
			const numChildren = nodeToExpand.children.length;

			let position = 0; // We don't want to use i as some childNodes aren't displayed (no name)
			for (let i = 0; i < numChildren; i++) {

				const childNode = nodeToExpand.children[i];
				childNode.expanded = false;
				childNode.level = nodeToExpand.level + 1;

				if (childNode && childNode.hasOwnProperty("name")) {
					if (this.nodesToShow.indexOf(childNode) === -1) {
						this.nodesToShow.splice(nodeToExpandIndex + position + 1, 0, childNode);
						position++;
					}
				}

			}

			nodeToExpand.expanded = true;
		}
	}

	/**
	 * Given a node expand the UI tree to that node and select it
	 * @param path the path array to traverse down
	 * @param level the level to start expanding at (generally the root node)
	 * @param noHighlight whether no highlighting should take place
	 * @param multi wether multiple nodes are selected in the selection
	 */
	public expandToSelection(path: any[], level: number, noHighlight: boolean, multi: boolean) {

		let selectedIndex;

		// Cut it to the level provided
		path = path.slice(level, path.length);

		for (let i = 0; i < path.length; i++) {
			const node = this.getNodeById(path[i]);
			this.expandTreeNode(node);

			// If it's the last node in the path
			// scroll to it
			if (i === path.length - 1) {
				selectedIndex = this.nodesToShow.indexOf(node);

				if (selectedIndex === -1) {
					// Sometimes we have an edge case where an object doesn't exist in the tree
					// because it has no name. It is often objects like a window, so what we do
					// is select its parent object to highlight that instead
					const specialNodeParent = this.getNodeById(path[i - 1]);
					selectedIndex =  this.nodesToShow.indexOf(specialNodeParent);
				}
			}
		}

		if (!noHighlight) {
			this.selectNodes([this.nodesToShow[selectedIndex]], multi, false).then(() => {
				this.selectedIndex = selectedIndex;
			});
		} else {
			this.selectedIndex = selectedIndex;
		}
	}

	/**
	 * Return a normalised path fo ra given object ID
	 * This will fix paths for federations.
	 * @param objectID the id of the node to get a path for
	 */
	public getPath(objectID: string) {
		let path;

		if (this.state.idToPath[objectID]) {
			// If the Object ID is on the main tree then use that path
			path = this.state.idToPath[objectID].split("__");
		} else if (this.subModelIdToPath[objectID]) {
			// Else check the submodel for the id for the path
			path = this.subModelIdToPath[objectID].split("__");
			const parentPath = this.subTreesById[path[0]].parent.path.split("__");
			path = parentPath.concat(path);
		} else {
			path = this.getNodeById(objectID).path.split("__");
		}

		return path;
	}

	/**
	 * Set the given visibility of a set of nodes
	 * @param nodes	Array of nodes to be hidden.
	 */
	public setVisibilityOfNodes(nodes: any[], visibility: string) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node && node.toggleState !== visibility) {
				this.setTreeNodeStatus(node, visibility);
			}
		}
	}

	/**
	 * Hide a collection of nodes.
	 * @param nodes	Array of nodes to be hidden.
	 */
	public hideTreeNodes(nodes: any[]) {
		this.setVisibilityOfNodes(nodes, "invisible");
		this.updateModelVisibility(this.allNodes[0]);
	}

	/**
	 * Show a collection of nodes.
	 * @param nodes	Array of nodes to be shown.
	 */
	public showTreeNodes(nodes: any[]) {
		this.setVisibilityOfNodes(nodes, "visible");
		this.updateModelVisibility(this.allNodes[0]);
	}

	public setTreeNodeStatus(node: any, visibility: string) {

		if (node && ("parentOfInvisible" === visibility || visibility !== node.toggleState)) {
			const priorToggleState = node.toggleState;

			let children = [];
			const leafNodes = [];
			const parentNode = node;

			if (node.children) {
				children = children.concat(node.children);
			} else {
				children = [node];
			}

			while (children.length > 0) {
				const child = children.pop();

				if (child.children && child.toggleState !== visibility) {
					children = children.concat(child.children);
				}

				if (!child.hasOwnProperty("defaultState")) {
					if (visibility === "visible" && this.canShowNode(child)) {
						child.toggleState = "visible";
					} else {
						child.toggleState = "invisible";
						this.setNodeSelection(child, false);
					}
				} else {
					if (visibility === "visible") {
						child.toggleState = (this.getHideIfc()) ? child.defaultState : "visible";
					} else {
						child.toggleState = "invisible";
						this.setNodeSelection(child, false);
					}
				}
			}

			this.updateParentVisibility(parentNode);
		}
	}

	/**
	 * Hide all tree nodes.
	 */
	public hideAllTreeNodes(updateModel) {
		this.setTreeNodeStatus(this.allNodes[0], "invisible");
		if (updateModel) {
			this.updateModelVisibility(this.allNodes[0]);
		}
	}

	/**
	 * Show all tree nodes.
	 */
	public showAllTreeNodes(updateModel) {
		this.setTreeNodeStatus(this.allNodes[0], "visible");

		// It's not always necessary to update the model
		// say we are resetting the state to then show/hide specific nodes
		if (updateModel) {
			this.updateModelVisibility(this.allNodes[0]);
		}
	}

	/**
	 * Hide selected objects 
	 */
	public hideSelected() {

		const selected = this.getCurrentSelectedNodes().concat();
		if (selected && selected.length) {
			this.hideTreeNodes(selected);
		}

	}

	/**
	 * Isolate selected objects by hiding all other objects.
	 */
	public isolateSelected() {

		const selectedNodes = this.getCurrentSelectedNodes().concat();

		// Hide all
		this.hideAllTreeNodes(false); // We can just reset the state without hiding in the UI
		// Show selected
		if (selectedNodes) {
			this.setCurrentSelectedNodes(selectedNodes);
			this.showTreeNodes(selectedNodes);
		}
	}

	public isolateNodesBySharedId(objects) {

		this.getMap()
		.then((treeMap) => {

			if (objects) {
				// Make a list of nodes to shown
				let shownNodes = [];
				for (let i = 0; i < objects.length; i++) {
					let objUid = treeMap.sharedIdToUid[objects[i].shared_id];

					if (objUid) {
						shownNodes.push(this.getNodeById(objUid));
					}
				}
				// Hide all
				this.hideAllTreeNodes(false); // We can just reset the state without hiding in the UI
				// Show selected
				if (shownNodes) {
					this.setCurrentSelectedNodes(shownNodes);
					this.showTreeNodes(shownNodes);
				}
			}
		})
		.catch((error) => {
			console.error(error);
		});

		
	}

	/**
	 * @returns	True if IFC spaces are not hidden or node is not an IFC space.
	 */
	public canShowNode(node: any) {
		return !(this.state.hideIfc && (
			(node.defaultState && "invisible" === node.defaultState) ||
			this.getHiddenByDefaultNodes().indexOf(node) !== -1));
	}

	/**
	 * @returns	True if node claims it has no children.
	 */
	public isLeafNode(node: any) {
		return !node.children || !node.children || node.children.length === 0;
	}



	/**
	 * Handle visibility changes from tree service to viewer service.
	 * @param clickedIds	Collection of ids to show/hide.
	 * @param visible	Set ids to visibile.
	 */
	public handleVisibility(clickedIds: any, visible: boolean) {

		const objectIds = {};

		for (const id in clickedIds) {
			if (id) {
				const account = clickedIds[id].account;
				const model = clickedIds[id].model || clickedIds[id].project; // TODO: Kill .project from backend
				const key = account + "@" + model;

				if (!objectIds[key]) {
					objectIds[key] = [];
				}

				objectIds[key].push(id);
			}
		}

		// Update viewer object visibility
		for (const key in objectIds) {
			if (key) {
				const vals = key.split("@");
				const account = vals[0];
				const model = vals[1];

				if (this.ViewerService.viewer) {
	
					this.ViewerService.switchObjectVisibility(
						account,
						model,
						objectIds[key],
						visible,
					);
				}

			}
		}
	}


	/**
	 * Update the state of clickedHidden and clickedShown, which are used by tree component
	 * to apply changes to the viewer.
	 * @param node	Node to toggle visibility. All children will also be toggled.
	 */
	public updateModelVisibility(node) {

		this.ready.promise.then(() => {
			const childNodes = {};
			this.traverseNodeAndPushId(node, childNodes, this.treeMap.idToMeshes);
			for (const key in childNodes) {
				if (!key) {
					continue;
				}
				const childMeshes = childNodes[key].meshes;

				if (!childMeshes) {
					continue;
				}

				for (let i = 0; i < childMeshes.length; i++) {

					const id  = childMeshes[i];
					const childNode = this.getNodeById(id);

					if (childNode) {
		
						if (childNode.toggleState === "invisible") {
							this.clickedHidden[childNode._id] = childNode;
						} else {
							delete this.clickedHidden[childNode._id];
						}
					
						if (childNode.toggleState === "visible") {
							this.clickedShown[childNode._id] = childNode;
						} else {
							delete this.clickedShown[childNode._id];
						}
						
					}
				}
			}

			this.handleVisibility(this.getClickedHidden(), false);
			this.handleVisibility(this.getClickedShown(), true);
	
		});

	}

	/**
	 * Unselect all selected items and clear the array
	 */
	public clearCurrentlySelected() {
		if (this.currentSelectedNodes) {
			this.currentSelectedNodes.forEach((selectedNode) => {
				selectedNode.selected = false;
			});
		}
		this.currentSelectedNodes = [];
	}

	/**
	 * Set selection status of node.
	 * @param node		Node to set.
	 * @param isSelected	Is selected.
	 */
	public setNodeSelection(node: any, isSelected: boolean) {
		if (node.selected !== isSelected) {
			const nodeIndex = this.currentSelectedNodes.indexOf(node);

			if (isSelected) {
				if (-1 === nodeIndex) {
					node.selected = true;
					this.currentSelectedNodes.push(node);
				}
			} else {
				if (nodeIndex > -1) {
					this.currentSelectedNodes[nodeIndex].selected = false;
					this.currentSelectedNodes.splice(nodeIndex, 1);
				}
			}
		}
	}

	/**
	 * Return a map of currently selected meshes
	 */
	public getCurrentMeshHighlights() {
		return this.ready.promise.then(() => {
			const currentSelectedMap = {};
			this.currentSelectedNodes.forEach((n) => {
				this.traverseNodeAndPushId(n, currentSelectedMap, this.treeMap.idToMeshes);
			});

			return currentSelectedMap;
		});
	}

	/**
	 * Select a node in the tree.
	 * @param node	Node to select.
	 * @param multi	Is multi select enabled.
	 */
	public selectNodes(nodes: any[], multi: boolean, additive: boolean, colour?: number[]) {

		console.log("multi")

		if (!nodes || nodes.length === 0) {
			return Promise.resolve("No nodes specified");
		}

		if (!multi) {
			// If it is not multiselect mode, remove all highlights
			this.clearCurrentlySelected();
		}

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];

			if (!node) {
				continue;
			}

			if (additive) {
				this.setNodeSelection(node, true);
			} else if (multi) {
				// Multiselect mode and we selected the same node - unselect it
				this.setNodeSelection(node, !node.selected);
			} else {
				// If it is not multiselect mode, remove all highlights
				this.clearCurrentlySelected();
				this.setNodeSelection(node, true);
			}

		}

		return this.highlightNodes(nodes, multi, colour);

	}

	public highlightNodes(nodes: any, multi: boolean, colour: number[]) {
		return this.ready.promise.then(() => {
			
			const highlightMap = {};
			nodes.forEach((n) => {
				this.traverseNodeAndPushId(n, highlightMap, this.treeMap.idToMeshes, colour);
			});


			// Update viewer highlights
			if (!multi) {
				this.ViewerService.clearHighlights();
			}

			for (const key in highlightMap) {
				if (key) {

					const vals = key.split("@");
					const account = vals[0];
					const model = vals[1];

					// Separately highlight the children
					// but only for multipart meshes
					this.ViewerService.highlightObjects({
						account,
						ids: highlightMap[key].meshes,
						colour: highlightMap[key].colour,
						model,
						multi: true,
						source: "tree",
					});
				}
			}

			return highlightMap;

		});
	}

	public selectNodesByIds(nodeIds: any[], multi: boolean, additive: boolean, colour: number[]) {
		const nodes = nodeIds.map((n) =>{
			return this.getNodeById(n._id);
		});

		this.selectNodes(nodes, multi, additive, colour);
	}

	public selectNodesBySharedIds(sharedIds: any[], multi: boolean, additive: boolean, colour: number[]) {
		return this.getMap().then(() => {
			
			const nodes = [];

			for (let i = 0; i < sharedIds.length; i++) {
				const objUid = this.treeMap.sharedIdToUid[sharedIds[i].shared_id];
				const node = this.getNodeById(objUid);
				nodes.push(node);
			}
			
			this.selectNodes(nodes, multi, additive, colour);
			
		});
	}

	public hideBySharedId(objects) {
		this.getMap()
			.then((treeMap) => {

				if (objects) {
					// Make a list of nodes to hide
					let hiddenNodes = [];
					for (let i = 0; i < objects.length; i++) {
						let objUid = treeMap.sharedIdToUid[objects[i].shared_id];

						if (objUid) {
							hiddenNodes.push(this.getNodeById(objUid));
						}
					}
					this.hideTreeNodes(hiddenNodes);
				}
			})
			.catch((error) => {
				console.error(error);
			});
	}

	public showBySharedId(objects) {

		this.getMap()
			.then((treeMap) => {

				this.hideAllTreeNodes(false);

				if (objects) {
					// Make a list of nodes to shown
					let shownNodes = [];
					for (let i = 0; i < objects.length; i++) {
						let objUid = treeMap.sharedIdToUid[objects[i].shared_id];

						if (objUid) {
							shownNodes.push(this.getNodeById(objUid));
						}
					}
					this.showTreeNodes(shownNodes);
				}
			})
			.catch((error) => {
				console.error(error);
			});

	}

	public highlightsBySharedId(objects) {

		this.getMap()
			.then((treeMap) => {

				let nodes = new Set();

				for (let i = 0; i < objects.length; i++) {
					let objUid = treeMap.sharedIdToUid[objects[i].shared_id];

					if (objUid) {
						let node = this.getNodeById(objUid);
						if (node && node.hasOwnProperty("name")) {
							nodes.add(node);
						}

						if (i === objects.length - 1) {
							// Only call expandToSelection for last selected node to improve performance
							this.initNodesToShow([this.allNodes[0]]);
							// TODO: we no longer need to select here, but still need to expand tree
							this.expandToSelection(this.getPath(objUid), 0, undefined, true);
							
							if (nodes.size > 0) {
								this.selectNodes(Array.from(nodes), false, true);
							}
						}
					}
				}

				angular.element((window as any)).triggerHandler("resize");
				
			})
			.catch((error) => {
				console.error(error);
			});
	
	}

	/**
	 * @returns	List of leaf nodes that are shown by default.
	 */
	public getShownByDefaultNodes() {
		return this.shownByDefaultNodes;
	}

	/**
	 * @returns	List of nodes that are hidden by default (usu. IFC space).
	 */
	public getHiddenByDefaultNodes() {
		return this.hiddenByDefaultNodes;
	}

	/**
	 * @returns	Value of IFC spaces hidden.
	 */
	public getHideIfc() {
		return this.state.hideIfc;
	}

	/**
	 * @param value	Are IFC spaces hidden.
	 */
	public setHideIfc(value: boolean) {
		this.state.hideIfc = value;
	}

	/**
	 * @param id	ID of node.
	 * @returns	Node with corresponding ID.
	 */
	public getNodeById(id: string) {
		return this.idToNodeMap[id];
	}

	/**
	 * Creates a map of IDs to nodes, array of nodes shown by default, and
	 * nodes hidden by default.
	 */
	public generateIdToNodeMap() {
		this.idToNodeMap = {};
		this.shownByDefaultNodes = [];
		this.hiddenByDefaultNodes = [];
		this.recurseIdToNodeMap(this.allNodes);
	}

	/**
	 * Helper function for generateIdToNodeMap().
	 * @param nodes	Collection of nodes to add to idToNodeMap.
	 */
	public recurseIdToNodeMap(nodes) {
		if (nodes) {
			nodes.forEach((node) => {
				if (node._id) {
					this.idToNodeMap[node._id] = node;
					if (node.toggleState === "visible" && (!node.children || node.children.length === 0)) {
						this.shownByDefaultNodes.push(node);
					}
					if (node.toggleState === "invisible") {
						this.hiddenByDefaultNodes.push(node);
					}
					node.defaultState = node.toggleState;
					this.recurseIdToNodeMap(node.children);
				}
			});
		}
	}

	/**
	 * Sets the collection of all nodes and calls generateIdToNodeMap().
	 * @param nodes	Collection of all nodes.
	 */
	public setAllNodes(nodes) {
		this.allNodes = nodes;
		this.generateIdToNodeMap();
	}

	/**
	 * @returns	Collection of all nodes.
	 */
	public getAllNodes() {
		return this.allNodes;
	}

}

export const TreeServiceModule = angular
	.module("3drepo")
	.service("TreeService", TreeService);
