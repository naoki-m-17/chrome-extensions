(function() {
    // パラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    // クエリが存在しない、または既に実行済みの場合は終了
    if (!query || window.hasClaudeQueryParamRun) return;

    // DOM出現まで待機してから処理を実行
    const injectAndSend = () => {
        // 入力エリアを取得（ClaudeはProseMirrorベースのcontenteditable）
        const inputArea = document.querySelector('div.ProseMirror[contenteditable="true"], [contenteditable="true"] p');

        if (inputArea) {
            // 監視を停止
            clearInterval(checkInterval);
            window.hasClaudeQueryParamRun = true;

            // 文字列をデコードして入力欄にセット
            const decodedText = decodeURIComponent(query);
            inputArea.innerText = decodedText;

            // 入力イベントを発火（React/Next.jsの状態同期）
            inputArea.dispatchEvent(new Event('input', { bubbles: true }));

            // KeyboardEvent（Enter = 送信）の定義
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });

            // 送信リトライ用変数
            let retryCount = 0;
            const maxRetries = 10;

            const trySend = () => {
                // アプリ側の状態更新（バリデーション解除）を信じてEnterを叩く
                inputArea.dispatchEvent(enterEvent);

                retryCount++;

                // 送信成功の判定:
                // ClaudeはURLが /new から /chat/{id} に変わるため、パス変化で判定
                // 入力欄にテキストが残っている場合も再試行
                if (window.location.pathname === '/new' && inputArea.innerText.length > 0 && retryCount < maxRetries) {
                    setTimeout(trySend, 100);
                }
                // 送信後、URLは /chat/{id} に変わるため、クエリパラメータは自然に消える
                // /new のまま残った場合のみクリーンアップ
                else if (window.location.pathname === '/new') {
                    setTimeout(() => {
                        if (window.location.pathname === '/new') {
                            const newUrl = window.location.origin + window.location.pathname + window.location.hash;
                            window.history.replaceState(null, '', newUrl);
                        }
                    }, 10000);
                }
            };

            // 最初の送信試行を開始
            trySend();
        }
    };

    // 0.5秒おきに入力欄の出現をチェック
    const checkInterval = setInterval(injectAndSend, 500);

    // 10秒経過しても見つからない場合は諦める（メモリリーク防止）
    setTimeout(() => clearInterval(checkInterval), 10000);
})();