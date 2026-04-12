# RaycastのQuicklinkでClaudeを使いたい！

Claude (claude.ai) のWeb版において、公式でサポートされていないURLクエリパラメータによるプロンプト入力を可能にするChrome拡張機能です。

## 開発の背景
RaycastのQuicklinksなど、外部ツールからAIモデルへ即座にアクセスする際、ChatGPTやPerplexityはURLパラメータをサポートしていますが、Claudeにはその機能がありません。
ブラウザでのAI利用においてClaudeを好むエンジニアが、入力をショートカット化してワークフローを高速化するために開発しました。

## 機能
- **シームレスなプロンプト注入**: `https://claude.ai/new?q=あなたの質問` というURLでアクセスすると、自動的に入力欄にプロンプトが注入されます。
- **全自動送信**: 入力後、アプリの状態（State）の更新を考慮したリトライロジックにより、自動で送信まで完結させます。
- **URLの自然なクリーンアップ**: Claudeは送信後にURLが `/new` から `/chat/{会話ID}` に変わるため、クエリパラメータは自動的に消滅します。

## 技術的特徴（エンジニア向け）
- **UI構造の変化に強い非依存設計**: 
    - 送信ボタン等の特定のDOM要素取得は、将来的なUI変更に弱いため採用していません。
    - 入力欄に対する「Enterキーイベントのシミュレーション」と「入力内容の残存チェック」を組み合わせたリトライアルゴリズムにより、確実に送信をトリガーします。
- **ClaudeのSPA設計への対応**:
    - Claudeは `/new` で新規チャットを開始し、送信後に `/chat/{UUID}` へ遷移するSPA設計です。
    - コンテンツスクリプトは `/new*` にのみマッチさせることで、既存チャットへの誤干渉を防止しています。
    - URL遷移により `?q=` パラメータは自然に消えるため、Gemini版のような明示的なクリーンアップが不要です。
- **パフォーマンス最適化**: 
    - `run_at: "document_start"` で早期注入し、パラメータ `q` が無い場合は即座にアーリーリターンします。
- **堅牢なDOM待機**: 
    - ClaudeのProseMirrorベースのエディタ出現を `setInterval` でポーリングし、`input` イベントのディスパッチでReact/Next.jsの状態を確実に同期させています。

## セットアップ手順
1. 本リポジトリをローカルにクローン、または `claude-query-param` フォルダを作成します。
2. Chromeのアドレスバーに `chrome://extensions/` を入力して開きます。
3. 右上の 「デベロッパー モード」 をONにします。
4. 左上の 「パッケージ化されていない拡張機能を読み込む」 ボタンを押し、`claude-query-param` フォルダを選択します。

## Raycastの設定
Raycastの **Create Quicklink** で以下の通り設定してください。

| 項目 | 設定値 |
| :--- | :--- |
| **Link** | `https://claude.ai/new?q={argument}` |
| **Open With** | Google Chrome |

さらに、Raycastの **Manage Fallback Command** にこのQuicklinkを登録しておくと、Raycastの入力欄にプロンプトを直接書いて起動できるようになります。

## ファイル構成
```text
claude-query-param/
├── manifest.json  # 拡張機能の設定（Manifest V3）
├── content.js     # プロンプト注入・自動リトライ送信ロジック
└── README.md      # 本ファイル