import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { StockHolding } from "../models";
import { DataStore } from "../data-store";
import { HoldingsManage } from "../react/components/holdings-manage";

/** 股票持仓管理弹窗：明细表 + 添加按钮；单条表单由 openHoldingForm 叠加打开 */
export class HoldingsManageModal extends Modal {
  private root: Root | null = null;
  private store: DataStore;
  private openHoldingForm: (holding?: StockHolding) => void;

  constructor(
    app: App,
    store: DataStore,
    openHoldingForm: (holding?: StockHolding) => void,
  ) {
    super(app);
    this.store = store;
    this.openHoldingForm = openHoldingForm;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.modalEl.addClass("finance-modal-wide");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <HoldingsManage
        store={this.store}
        onAddHolding={() => this.openHoldingForm()}
        onEditHolding={(holding) => this.openHoldingForm(holding)}
      />,
    );
  }

  onClose(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.contentEl.empty();
  }
}
