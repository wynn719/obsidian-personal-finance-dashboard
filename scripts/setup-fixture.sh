#!/usr/bin/env bash
#
# setup-fixture.sh
# 将 fixture vault 中的插件文件替换为指向项目根目录构建产物的软链接。
# 这样 `npm run dev` 后 Obsidian 会自动加载最新代码，无需手动复制。
#
# 用法：
#   ./scripts/setup-fixture.sh
#
set -euo pipefail

# 项目根目录（脚本所在目录的上一级）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PLUGIN_DIR="$PROJECT_ROOT/fixture/.obsidian/plugins/personal-finance-dashboard"

# 需要软链接的文件（源文件在项目根目录）
FILES=("main.js" "manifest.json" "styles.css")

echo "🔗 Setting up fixture vault symlinks..."
echo "   Project root: $PROJECT_ROOT"
echo "   Plugin dir:   $PLUGIN_DIR"
echo ""

# 确保插件目录存在
mkdir -p "$PLUGIN_DIR"

for file in "${FILES[@]}"; do
  SOURCE="$PROJECT_ROOT/$file"
  TARGET="$PLUGIN_DIR/$file"

  # 检查源文件是否存在
  if [ ! -f "$SOURCE" ]; then
    echo "⚠️  Source file not found: $SOURCE"
    echo "   Run 'npm run dev' or 'npm run build' first to generate it."
    continue
  fi

  # 如果目标已经是正确的软链接，跳过
  if [ -L "$TARGET" ]; then
    CURRENT_LINK="$(readlink "$TARGET")"
    if [ "$CURRENT_LINK" = "$SOURCE" ]; then
      echo "✓  $file — already linked"
      continue
    fi
  fi

  # 移除已有文件（普通文件或错误的软链接）
  if [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
    rm "$TARGET"
    echo "🗑  Removed existing: $file"
  fi

  # 创建软链接
  ln -s "$SOURCE" "$TARGET"
  echo "✓  $file → $SOURCE"
done

echo ""
echo "✅ Done! Fixture vault is now linked to build outputs."
echo "   Open 'fixture/' as an Obsidian vault to test the plugin."
