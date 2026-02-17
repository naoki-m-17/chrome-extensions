(function() {
    // パラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    // クエリが存在しない、または既に実行済みの場合は終了
    if (!query || window.hasGeminiQueryParamRun) return;

    // DOM出現まで待機してから処理を実行
    const injectAndSend = () => {
        // 入力エリアを取得
        const inputArea = document.querySelector('.rich-textarea p, [role="textbox"]');
        
        if (inputArea) {
            // 監視を停止
            clearInterval(checkInterval);
            window.hasGeminiQueryParamRun = true;

            // 文字列をデコードして入力欄にセット
            const decodedText = decodeURIComponent(query);
            inputArea.innerText = decodedText;
            
            // 入力イベントを発火
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
                
                // 入力欄が空でない、あるいは別の要素に切り替わらない場合、再試行
                if (inputArea.innerText.length > 0 && retryCount < maxRetries) {
                    setTimeout(trySend, 100);
                } else {
                    // 送信成功（または諦め）後のパラメータ削除
                    setTimeout(() => {
                        const newUrl = window.location.origin + window.location.pathname + window.location.hash;
                        window.history.replaceState(null, '', newUrl);
					// 出力時にChrome側でパラメータをつけられてしまうので、長くする
					// setTimeout が非同期処理のため、回答生成には影響しない
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