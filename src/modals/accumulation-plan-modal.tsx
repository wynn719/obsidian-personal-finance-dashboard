import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import type { AccumulationPlan } from "../accumulation/types";
import type { AccumulationStore } from "../accumulation/store";
import { AccumulationPlanForm } from "../react/forms/accumulation-plan-form";

export class AccumulationPlanModal extends Modal {
  private root: Root | null = null;
  private store: AccumulationStore;
  private existingPlan: AccumulationPlan | undefined;

  constructor(app: App, store: AccumulationStore, existingPlan?: AccumulationPlan) {
    super(app);
    this.store = store;
    this.existingPlan = existingPlan;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    // 阶段编辑器列多，用宽弹窗
    this.modalEl.addClass("finance-modal-wide");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <AccumulationPlanForm
        store={this.store}
        existingPlan={this.existingPlan}
        onClose={() => this.close()}
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
