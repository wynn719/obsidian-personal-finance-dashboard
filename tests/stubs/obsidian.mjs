/**
 * obsidian 模块的测试替身。
 * 纯计算模块不该碰它；保留这个桩是为了将来把 store 的纯逻辑也纳入测试时，
 * esbuild 的 `alias: { obsidian: ... }` 有个确定的落点。
 */
export class Plugin {}
export class Modal {}
export class ItemView {}
export class PluginSettingTab {}
export class Setting {}
export class Notice {}
export class TFile {}
export class EventRef {}
export const normalizePath = (p) => p;
export const setIcon = () => {};
