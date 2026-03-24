---
name: commit-msg
description: 根據目前 git diff 自動產生合適的 commit message 並提交
argument-hint: [可選：額外說明]
---

根據目前的 git 變更，幫我產生一個好的 commit message 並提交。

步驟：
1. 執行 `git diff --staged` 查看已暫存的變更
2. 如果沒有已暫存的內容，執行 `git diff` 查看未暫存的變更
3. 分析變更內容，產生符合以下格式的 commit message：
   - 第一行：簡短摘要（50字以內），使用動詞開頭（例如：Add, Fix, Update, Remove）
   - 如有需要，空一行後加上詳細說明
4. 如果使用者有提供 $ARGUMENTS，將其納入 commit message 的考量
5. 向使用者確認 commit message 後再執行 git commit
