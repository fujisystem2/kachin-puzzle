$(function(){

	// スクロール禁止
	$(window).on('touchmove.noScroll', function(e) {
	    e.preventDefault();
	});

	// touch
	var touch={
		"left":false,
		"right":false,
		"up":false,
		"down":false,
		"longTap":false
		};

	// touch clear
	var touchClear = function(){
		for (tmp in touch){
			if (tmp){
				touch[tmp] = false;
			}
		};
	};



	// B.G.M.関連初期化
	window.Track0 = null; // main track (BGM), iOS Pseudo unity track
	window.Track1 = null; // sub track (S.E.)
	window.Track2 = null; // sub track (Jingle)
	window.canplayCallback = null;
	init(0);

	function init(iOSSimulate) {
	    if (!window.UnitePlayer ||
	        !window.UnitePlayer.ready) {
	        alert("Need iOS 4.0 and later, Android 2.3 and later");
	        return;
	    }
	    if (window.Track0) { // singleton
	        return;
	    }

	    var param = {
			mp3:    "sound/kachin.mp3",
			volume: 0.5,
			preset: {
				// --- BGM ---
				BGM_Mute:		["0:00", "0:10", true],
				BGM_Main:		["0:15", "0:40.57", true],
				// --- SE ---
				//SE_Jump:            ["2:00", "2:00.576"],
				// --- Jingle ---
				Z_Clear:		["0:46", "0:49.8"],
				Z_GameOver:		["0:55", "0:56.5"],
				Z_Miss:			["1:02", "1:04"]
			}
		};

	    window.Track0 = new UnitePlayer(param, 0, function(evt, that, track, time, dur) {

	        //log("track" + track, evt.type, time.toFixed(3), dur.toFixed(3));

	        if (evt.type === "canplay" && window.canplayCallback) {
	            window.canplayCallback();
	        }
	    });

	    if (!iOSSimulate) {
	        if (UnitePlayer.enableMultiTrack) {
	            // single audio
	            ;
	        } else {
	            // multi audio
	            window.Track1 =
	                    new UnitePlayer(param, 1, function(evt, that, track, time, dur) {
	                //log("track" + track, evt.type, time.toFixed(3));
	            });
	            window.Track2 =
	                    new UnitePlayer(param, 2, function(evt, that, track, time, dur) {
	                //log("track" + track, evt.type, time.toFixed(3));
	            });
	        }
	    }
	}

	function touchFirst() {
	    var btn1 = document.getElementById("play_btn1"),
	        btn2 = document.getElementById("play_btn2"),
	        btn3 = document.getElementById("play_btn3");

	    // btn1 -> btn2 -> btn3
	    btn1.style.display = "inline-block";
	    btn1.onclick = function() {
	        btn1.parentNode.removeChild(btn1);
	        btn2.style.display = "inline-block";
	        canplayCallback = function() {
	            btn2.parentNode.removeChild(btn2);
	            btn3.style.display = "inline-block";
	            setTimeout(function() {
	                btn3.parentNode.removeChild(btn3);
	            }, 1000);
	        };
	        init(0);
	    };
	}

	function preset(name, track) {
	    switch (track) {
			case 2:
				if (window.Track2) {
					window.Track2.preset(name);
					break;
				}
			case 1:
		    	if (window.Track1) {
					window.Track1.preset(name);
					break;
				}
			case 0:
				window.Track0.preset(name);
	    }
	}

	if (window.UnitePlayer.needTouchFirst) {
	    document.addEventListener("DOMContentLoaded", function() {
	        document.getElementById("init_btn").style.display = "none";
	        touchFirst();
	    }, false);
	}



	//Enable swiping...
	$("#touchPad").swipe( {
		//Generic swipe handler for all directions
		swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
			if (direction){ touch[direction]=true; };
		},
		longTap:function(event, target) {
			touch.longTap = true;
		},
		longTapThreshold:1000,
		//Default is 75px, set to 0 for demo so any distance triggers swipe
		threshold:5
	});

	// 虹色処理
	var setRainbow = function(){
		var rainbowBringer = setInterval(
			function(){
				var COLORS = [ "red", "orange", "yellow", "green", "blue", "navy", "purple" ];
				$(".rainbow").each(function (index) {
					var txt = $(this).text();
					var html = "";
					for (var i = 0, l = txt.length; i < l; i++) {
						var r = Math.round(Math.random()*COLORS.length);
						html += "<span style=\"color: " + COLORS[r] + "\">" + txt[i] + "</span>";
					};
					$(this).html(html);
				});
			}
		,500);
		return rainbowBringer;
	};
	var rainbowBringer = setRainbow();

	// Roundデータ 取得
	var roundDatas = {};
	$.ajax({
		type: "GET",
		url: "json/maps.json",
		dataType: "json",
		async: false,
		success: function(data){
			roundDatas = data;
		},
		error : function (XMLHttpRequest, textStatus, errorThrown) {
			console.log(XMLHttpRequest);	// XMLHttpRequestオブジェクト
			console.log(textStatus);		// status は、リクエスト結果を表す文字列
			console.log(errorThrown);		// errorThrown は、例外オブジェクト
		}
	});

	// キャラ紹介
	$("ul#charcter li").each(function() {
		if ($(this).find("svg desc").html()) {
			$(this).append("<span>" + $(this).find("svg desc").html() + "</span>");
		}
	});

	// 隠れ要素
	$("div#HideCharcter").hide();

	// キーボード初期化
	Keyboard_Init();

	// ゲームスタート (dom クリア)
	var startGameTimer = setInterval(
		function(){
			if (key.space || touch.longTap){

				// touch clear
				touchClear();

				// タイトル除去
				$("#title").remove();

				// フッター/spanの除去
				$("#footer").remove();
				$("span").remove();

				// キャラ隠し
				$("ul#charcter").hide();

				// タイマクリア
				clearInterval(rainbowBringer);
				clearInterval(startGameTimer);

				// ゲーム初期化 呼び出し
				gameInit();
			}
		}
	,100);

	// ゲーム初期化
	var gameInit = function(){
		var life = 5;
 		var round = 1;
 		var cntPutBalls = 0;

		var moveX = 0;
		var moveXold = 0;
		var moveY = 0;
		var moveYold = 0;
		var moveAxis = 0;
		var destX = 0;
		var destY = 0;
		var transX = 0;
		var transY = 0;
		var destChk = "";
		var transChk = "";

		// waitフラグ
		var flgWait = false;

		// init
		var aryMapInfo = displayMap(round, life);
		var posX = aryMapInfo.posX;
		var posY = aryMapInfo.posY;
		var chainLength = aryMapInfo.chainLength;
		var tmpMap = aryMapInfo.tmpMap;

		// B.G.M.
		preset('BGM_Main', 0);


		// ゲームメイン
		var mainTimer = setInterval(
			function(){

				// 連続入力は許可しない (予定)
				moveX = (key.right?key.right:0)-(key.left?key.left:0) + (touch.right?touch.right:0) - (touch.left?touch.left:0);
				moveY = (key.down?key.down:0)-(key.up?key.up:0) + (touch.down?touch.down:0) - (touch.up?touch.up:0);
				moveAxis = Math.abs(moveX) + Math.abs(moveY);

				destX = posX + moveX;
				destY = posY + moveY;
				transX = posX + moveX *2;
				transY = posY + moveY *2;
				destChk = moveAxis==1 ? tmpMap.getMap(destX, destY) : "";
				transChk = tmpMap.getMap(transX, transY);

				//console.log( "moveAxis:" + moveAxis + ":" + posX + ":" + posY + ":" + destX + ":" + destY + ":" + transX + ":" + transY + ":" + tmpMap.getMap(posX, posY) + ":" + destChk + ":" + transChk + ";" + chainLength );

				switch ( destChk ) {
					// 移動先が、空白や鎖や出口
					case "_":
					case "x":
					case "O":
						// 何もしない.
						break;

					// 移動先が壁
					case "H":
						// 移動距離0にする.
						destX = posX;
						destY = posY;
						break;

					// 移動先が、ジャマーブル
					case "G":
						// 緑玉の移動先が空白なら、移動先へ緑球移動し、緑球の移動元に空白を入れる.
						if (transChk == "_") {
							tmpMap[transX + "," + transY] = { "typ":"G" };
							$("#" + transX + "_" + transY).html( $("#jyaMarble").clone(true) );

							tmpMap[destX + "," + destY] = { "typ":"_" };
							$("#" + destX + "_" + destY).html ( $("#blank").clone(true) );
						} else {
							// 移動距離0にする.
							destX = posX;
							destY = posY;
						}
						break;

					// 移動先が、カッチン玉
					case "R":
						// (移動先先が空白か鎖か出口)、かつ、鎖の長さが3未満　あるいは、移動先が赤玉でその先が鎖 の場合
						if ( (/[_xO]/.test( transChk ) && chainLength<3 ) || transChk == "x") {
							// 鎖の長さを　移動先先が鎖ならマイナス1、それ以外なら、プラス1する
							chainLength -= (transChk == "x") - (transChk != "x");

							// カッチン玉が出口に入れられたら
							if (transChk == "O"){
								// 玉入れ数をカウントアップ
								cntPutBalls++;

								// 移動先先に出口を表示
								// (JavaScript版は不要)
							} else {
								// 赤玉表示
								tmpMap[transX + "," + transY] = { "typ":"R" };
								$("#" + transX + "_" + transY).html( $("#katchinDama").clone(true) );
							}

							// 移動先先が鎖の場合
							if (transChk == "x"){
								// 移動先に空白を表示
								tmpMap[destX + "," + destY] = { "typ":"_" };
								$("#" + destX + "_" + destY).html( $("#blank").clone(true) );
							} else {
								//それ以外は、移動先に鎖を表示
								tmpMap[destX + "," + destY] = { "typ":"x" };
								$("#" + destX + "_" + destY).html( $("#kusari").clone(true) );
							}
						} else {
							// 移動距離0にする.
							destX = posX;
							destY = posY;
						}
						break;

					// 移動先が上記以外の場合
					default:
						// 移動距離0にする.
						destX = posX;
						destY = posY;
						break;
				}

				// 移動判定後、移動（4方向のみ）
				if (flgWait == false){
					if (moveAxis == 1){
						// 座標移動
						posX = destX;
						posY = destY;

						// タッチクリア
						touchClear();

						// パンプネコのセット
						$("span#" + posX + "_" + posY).append( $("#pampuuNekoSpn") );
					}
				} else {
					// wait中
					$("#pampuuNekoSpn").hide();
				}

				// クリア判定
				if (cntPutBalls > 1){
					if ( flgWait == false ){
						flgWait = true;
						round++;

						// sound
						preset('BGM_Mute', 0);
						preset('Z_Clear', 2);

						// 待ち処理
						var wt = 0;
						var wtTimer = setInterval(function() {
						    wt++;

						    // 終了条件
						    if (wt == 8) {
						    	flgWait = false;

								if (round==11){
									// ゲームクリア処理
									clearInterval(mainTimer);

									// sound
									preset('Z_GameOver', 2);

									$('div[id^="row_"]').html("　");
									$("#info").empty();
									var rainbowBringer = setRainbow();
									$("#messages").html("OTSUKARE SAMA!!");
									setInterval(function() {
										if (key.space || touch.longTap){ location.reload(); }
									}, 100);
								} else {

									// init
									aryMapInfo = displayMap(round, life);
									posX = aryMapInfo.posX;
									posY = aryMapInfo.posY;
									chainLength = aryMapInfo.chainLength;
									tmpMap = aryMapInfo.tmpMap;
									cntPutBalls = 0;

									// BGM 再開
									preset('BGM_Main', 0);
								}
								clearInterval(wtTimer);
						    }
						}, 500);
					}
				};

				// ミス判定
				if (key.space  || touch.longTap || flgWait) {
					if ( flgWait == false ){
						touch.longTap = false;
						flgWait = true;
						life--;

						// sound
						preset('BGM_Mute', 0);
						preset('Z_Miss', 2);

						// 待ち処理
						var wt = 0;
						var wtTimer = setInterval(function() {
						    wt++;

						    // 終了条件
						    if (wt == 5) {
						    	flgWait = false;

								if (life<0){
									// ゲームオーバ処理
									clearInterval(mainTimer);

									// sound
									preset('Z_GameOver', 2);

									$('div[id^="row_"]').html("　");
									$("#info").empty();
									var rainbowBringer = setRainbow();
									$("#messages").html("GAME OVER");
									setInterval(function() {
										if (key.space || touch.longTap){ location.reload(); }
									}, 100);
								} else {

									// init
									aryMapInfo = displayMap(round, life);
									posX = aryMapInfo.posX;
									posY = aryMapInfo.posY;
									chainLength = aryMapInfo.chainLength;
									tmpMap = aryMapInfo.tmpMap;
									cntPutBalls = 0;

									// BGM 再開
									preset('BGM_Main', 0);
								}
								clearInterval(wtTimer);
						    }
						}, 500);
					}
				}
			}
		, 100);

		// 戻る
		return;
	};

	// map 描画
	var displayMap = function(round, life){
		// 入れ物
		var tmpMap = {
			"getMap": function(x,y){
					return this[x + "," + y]?this[x + "," + y].typ:null;
				}
			};

		// 表示クリア
		$("#displayRound").empty();

		// マップ表示
		var roundData = roundDatas[round-1];
		for(i=0,l=roundData.map.length; i<l; i++){
			// JSONからの面データのパース (11文字単位であること前提)
			var tmpRowData = roundData.map[i];
			var tmpColData = tmpRowData.match(/^(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)$/);

			// 最初の項目（全マッチ）を削除する
			tmpColData.splice(0,1);

			// li要素の追加
			$("#displayRound").append("<li><div id=\"row_" + i + "\"></div></li>");

			// 1行ずつ追加
			var target;
			for(j=0,m=tmpColData.length; j<m; j++){
				// キャラ差込
				switch ( tmpColData[j] ) {
					case "_":
						target = $("#blank");
						break;
					case "H":
						target = $("#kabe");
						break;
					case "E":
						target = $("#kabe2");
						break;
					case "G":
						target = $("#jyaMarble");
						break;
					case "R":
						target = $("#katchinDama");
						break;
					case "x":
						target = $("#kusari");
						break;
					case "O":
						target = $("#deguchi");
						break;
					case "M":
						target = $("#MSX_M");
						break;
					case "S":
						target = $("#MSX_S");
						break;
					case "X":
						target = $("#MSX_X");
						break;
					default:
						target = $("#blank");
						break;
				}

				// メモリ配列にセット
				tmpMap[j + "," + i] = { "typ":tmpColData[j] };

				// SVG差込
				$("#row_" + i).append("<span id=\"" + j + "_" + i + "\"></span>");
				$("span#" + j + "_" + i).append( target.clone(true) );
			}

			// 鎖長さ & 初期位置セット
			var chainLength = roundData.chainLength;
			var posX = roundData.initX;
			var posY = roundData.initY;
		}

		// パンプネコ移動用
		$("span#" + posX + "_" + posY).append( "<span id=\"pampuuNekoSpn\" style=\"position:absolute; left:-1px; top:-11px;\"></span>" );
		$("#pampuuNekoSpn").append( $("#pampuuNeko").clone(true).attr("id", "pampuuNeko_") );

		// 面数 / 残ネコ数
		$("#info").html( "NUMBER " + ("0"+round).slice(-2) + " / PAMPUU " + life );

		// 面情報バッファ返却
		return { "tmpMap":tmpMap, "posX":posX, "posY":posY, "chainLength":chainLength };
	}
});
