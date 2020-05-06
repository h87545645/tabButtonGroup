



enum PARAM_TYPE {
	NODE_INDEX,
	NODE_NAME
}
const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class TabButtonGroup extends cc.Component {

	private _isAddBtn : boolean = false;

	@property({ type: cc.Node })
	defaultTab: cc.Node = null

	@property({ type: [cc.Node] })
	_tabsNode: Array<cc.Node> = new Array<cc.Node>(1);
	@property({
		tooltip: 'tab节点',
		type: [cc.Node],
	})
	public set TabsNode(tabArr: Array<cc.Node>) {
		// cc.log("gen init")
		if (tabArr.length < 1) {
			this.TabsNode = new Array<cc.Node>(1);
			return;
		}
		this._tabsNode = tabArr;
		this._genTabs(tabArr);
		this._updateLayout();
	}
	public get TabsNode(): Array<cc.Node> {
		return this._tabsNode
	}

	@property({})
	_onLabColor: cc.Color = new cc.Color(255, 255, 255);
	@property({
		tooltip: 'tab激活时的label的颜色',
	})
	public set OnLabColor(color: cc.Color) {
		this._onLabColor = color;
		if (this.defaultTab) {
			this.defaultTab.getChildByName("on").getChildByName("label").color = this._onLabColor;
		}
	}
	public get OnLabColor(): cc.Color {
		return this._onLabColor
	}
	@property({})
	_offLabColor: cc.Color = new cc.Color(235, 181, 255);
	@property({
		tooltip: 'tab未激活时的label的颜色',
	})
	public set OffLabColor(color: cc.Color) {
		this._offLabColor = color;
		if (this.defaultTab) {
			this.defaultTab.getChildByName("off").getChildByName("label").color = this._offLabColor;
		}
	}
	public get OffLabColor(): cc.Color {
		return this._offLabColor
	}

	@property({
		type: cc.Enum(PARAM_TYPE),
		tooltip: '节点按钮事件的自定义数据, node_index为节点的的index, node_name为节点名字'
	})
	customData: PARAM_TYPE = PARAM_TYPE.NODE_INDEX;

	@property([cc.Component.EventHandler])
	touchEvents: cc.Component.EventHandler[] = [];


	// LIFE-CYCLE CALLBACKS:
	/**
	 * 生成初始化tab
	 * @param tabArr tab数量
	 */
	private _genTabs(tabArr) {
		if (CC_EDITOR) {
			//删除已有
			let children = this.node.children.concat()
			for (let i = 0; i < children.length; i++) {
				if (i == 0) {
					continue;
				}
				if (children[i] != null) {
					children[i].removeFromParent(true)
					children[i].destroy()
				}
			}
			//generate 
			for (let i = 0; i < tabArr.length; i++) {
				if (i == 0 && this.node.children.length == 1) {
					this.TabsNode[i] = this.node.children[i];
					continue;
				}
				let tab = null;
				if (this.defaultTab && this.node.children.length > 0) {
					tab = cc.instantiate(this.defaultTab);
				} else {
					tab = this._genNewTab(i);
					this.defaultTab = tab;
				}
				tab.parent = this.node;
				this.TabsNode[i] = tab;
			}
		}
	}

	/**
	 * 生成一个新的tab模版
	 * @param i 下标
	 */
	private _genNewTab(i) {
		let tab = new cc.Node("tab");
		let onNode = this._genButtonNode("on", this.OnLabColor);
		let offNode = this._genButtonNode("off", this.OffLabColor);
		onNode.active = false;
		tab.setContentSize(cc.size(100, 100));
		tab.addChild(offNode, i);
		tab.addChild(onNode, i);
		return tab;
	}

	private _genButtonNode(name, color) {
		let root = new cc.Node(name);
		root.addComponent(cc.Sprite);
		let label = this._genLabel(color);
		root.addChild(label);
		return root;
	}

	private _genLabel(color) {
		let label = new cc.Node("label");
		label.addComponent(cc.Label);
		label.getComponent(cc.Label).string = "TAB Name";
		label.color = color;
		return label;
	}

	/**
	 * 根据tab 调整layout大小
	 */
	private _updateLayout() {
		if (!this.defaultTab) {
			return;
		}
		let w, h = null;
		let layout = this.node.getComponent(cc.Layout);
		if (layout.type == cc.Layout.Type.VERTICAL) {
			h = (this.defaultTab.height + layout.spacingY) * this.TabsNode.length;
			w = this.defaultTab.width;
		} else if (layout.type == cc.Layout.Type.HORIZONTAL) {
			w = (this.defaultTab.width + layout.spacingX) * this.TabsNode.length;
			h = this.defaultTab.height;
		}
		this.node.width = w;
		this.node.height = h;
	}

	/**
	 * 添加button组件
	 */
	private _addTabButtonComp() {
		if (this._isAddBtn) {
			return;
		}
		this._isAddBtn = true;
		this.node.children.forEach((node, nodeIndex) => {
			let btnComp =  node.getComponent(cc.Button)

			if (btnComp == null) {
				node.addComponent(cc.Button)
				btnComp = node.getComponent(cc.Button);
			}
			// 判断button，将ccButton替换为自定义的UICustomButton
			let btnCompName = cc.js.getClassName(btnComp)
			if ( btnCompName === 'cc.Button') {
				let newBtnComp = node.addComponent("cc.Button")

				newBtnComp.transition = btnComp.transition;
				newBtnComp.zoomScale = btnComp.zoomScale;

				newBtnComp.disabledSprite = btnComp.disabledSprite;
				newBtnComp.hoverSprite = btnComp.hoverSprite;
				newBtnComp.normalSprite = btnComp.normalSprite;
				newBtnComp.pressedSprite = btnComp.pressedSprite;

				newBtnComp.hoverColor = btnComp.hoverColor;
				newBtnComp.normalColor = btnComp.normalColor;
				newBtnComp.pressedColor = btnComp.pressedColor;
				newBtnComp.disabledColor = btnComp.disabledColor;

				newBtnComp.target = btnComp.target

				btnComp = newBtnComp
				node.removeComponent(cc.Button) // 移除老button
			}

			//绑定回调事件
			this.touchEvents.forEach((event: cc.Component.EventHandler) => {
				//克隆数据，每个节点获取的都是不同的回调
				let hd = new cc.Component.EventHandler() //copy对象
				hd.component = event['_componentName']
				hd.handler = event.handler
				hd.target = event.target
				if (this.customData === PARAM_TYPE.NODE_INDEX) {
					hd.customEventData = nodeIndex.toString()
				} else {
					hd.customEventData = node.name
				}
				btnComp.clickEvents.push(hd)
			})

		})
	}


	protected onLoad() {
		if (CC_EDITOR) {
			//添加layout
			if (!this.node.getComponent(cc.Layout)) {
				this.node.anchorY = 1;
				cc.log("TabButtonGroup add cc.Layout");
				this.node.addComponent(cc.Layout);
				this.node.getComponent(cc.Layout).type = cc.Layout.Type.VERTICAL;
				this.node.anchorY = 1;
				this._updateLayout();
			}
			if (!this.defaultTab || this.TabsNode.length < 1) {
				this.TabsNode = this.TabsNode;
			}
			return;
		}
		this._addTabButtonComp();
	}



	/**
	 * tab状态切换
	 * @param index tab下标
	 */
	public changeTab(index) {
		if (!this._isAddBtn) {
			this._addTabButtonComp();
		}
		for (let i = 0; i < this.TabsNode.length; i++) {
			this.TabsNode[i].getComponent(cc.Button).interactable = true;
			this.TabsNode[i].getChildByName("on").active = false;
			this.TabsNode[i].getChildByName("off").active = true;
		}
		this.TabsNode[index].getComponent(cc.Button).interactable = false;
		this.TabsNode[index].getChildByName("on").active = true;
		this.TabsNode[index].getChildByName("off").active = false;

	}

	/**
	 * 设置默认激活tab
	 */
	public initTab(index = 1) {
		this.changeTab(index - 1);
	}

	/**
	 * 设置tab label string
	 * @param list 
	 */
	public setTabLabel(list) {
		for (let index = 0; index < list.length; index++) {
			if (this.TabsNode[index]) {
				this.TabsNode[index].active = true;
				this.TabsNode[index].getChildByName("on").getChildByName("label").getComponent(cc.Label).string = list[index].title;
				this.TabsNode[index].getChildByName("off").getChildByName("label").getComponent(cc.Label).string = list[index].title;
			} else {
				let newtab = cc.instantiate(this.TabsNode[0]);
				newtab.getChildByName("on").getChildByName("label").getComponent(cc.Label).string = list[index].title;
				newtab.getChildByName("off").getChildByName("label").getComponent(cc.Label).string = list[index].title;
				let btnComp =  newtab.getComponent(cc.Button)
				btnComp.clickEvents[0].customEventData = index.toString();
				this.node.addChild(newtab);
				this.TabsNode.push(newtab);
			}
		}
	}

	public hideAll() {
		for (let i = 0; i < this.TabsNode.length; i++) {
			this.TabsNode[i].active = false;
		}
	}
}
