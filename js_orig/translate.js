var _ = window._;

_.stateAbbreviations = [
	"USA", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", 
	"KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", 
	"ND", "NMI", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "VI", "UT", "VT", "VA", "WA", "WV",
	"WI", "WY"
];
_.states = [
	"USA", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
	"District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
	"Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
	"Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", 
	"North Dakota", "Northern Mariana Islands", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", 
	"Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "U.S. Virgin Islands", "Utah", "Vermont", 
	"Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];
_.translate.esTranslations = [
	"EE.UU", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
	"Distrito de Columbia", "Florida", "Georgia", "Guam", "Hawái", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", 
	"Kentucky", "Luisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Misisipí", "Misuri", 
	"Montana", "Nebraska", "Nevada", "Nueva Hampshire", "Nueva Jersey", "Nuevo México", "Nueva York", 
	"Carolina del Norte", "Dakota del Norte", "Islas Marianas del Norte", "Ohio", "Oklahoma", "Oregón", "Pensilvania", 
	"Puerto Rico", "Rhode Island", "Carolina del Sur", "Dakota del Sur", "Tennessee", "Texas", 
	"Islas Vírgenes de EE.UU", "Utah", "Vermont", "Virginia", "Washington", "Virginia del Oeste", "Wisconsin", "Wyoming"
];
_.translate.cnTranslations = [
	"美国", "阿拉巴马州",  "阿拉斯加州", "亚利桑那州", "阿肯色州", "加利福尼亚州", "科罗拉多州", "康涅狄格州", "特拉华州", "哥伦比亚特区",
	"佛罗里达州", "乔治亚州", "关岛", "夏威夷", "爱达荷州", "伊利诺伊州", "印第安纳州", "爱荷华州", "堪萨斯州", "肯塔基州",
	"路易斯安那州", "缅因州", "马里兰州", "马萨诸塞州", "密歇根州", "明尼苏达州", "密西西比州", "密苏里州", "蒙大拿州", 
	"内布拉斯加州", "内华达州", "新罕布什尔州", "新泽西州", "新墨西哥州", "纽约州", "北卡罗来纳州", "北达科他州",
	"北马里亚纳群岛", "俄亥俄州", "俄克拉荷马州", "俄勒冈州", "宾夕法尼亚州", "波多黎各", "罗德岛", "南卡罗来纳州", "南达科他州", 
	"田纳西州", "得克萨斯州", "美属维尔京群岛", "犹他州", "佛蒙特", "弗吉尼亚州", "华盛顿州", "西弗吉尼亚州", "威斯康星州", "怀俄明州"
];
_.translate.frTranslations = [
	"États-Unis", "Alabama", "Alaska", "Arizona", "Arkansas", "Californie", "Colorado", "Connecticut", "Delaware", 
	"District de Colombie", "Floride", "Géorgie", "Guam", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", 
	"Kentucky", "Louisiane", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
	"Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "Nouveau Mexique", "New York", "Caroline du Nord", 
	"Dakota du Nord", "Îles Mariannes du Nord", "Ohio", "Oklahoma", "Oregon", "Pennsylvanie", "Porto Rico", 
	"Rhode Island", "Caroline du Sud", "Dakota du Sud", "Tennessee", "Texas", "Îles Vierges américaines", "Utah", 
	"Vermont", "Virginie", "Washington", "Virginie-Occidentale", "Wisconsin", "Wyoming"
];
_.translate.jpTranslations = [
	"米国", "アラバマ", "アラスカ", "アリゾナ", "アーカンザス", "カリフォルニア", "コロラド", "コネチカット", "デラウェア", 
	"コロンビア特別区", "フロリダ", "ジョージア", "グアム", "ハワイ", "アイダホ", "イリノイ", "インディアナ", "アイオワ", 
	"カンザス", "ケンタッキー", "ルイジアナ", "メイン", "メリーランド", "マサチューセッツ", " ミシガン", "ミネソタ", 
	"ミシシッピ", "ミズーリ", "モンタナ", "ネブラスカ", "ネバダ", "ニューハンプシャー", "ニュージャージー", "ニューメキシコ", 
	"ニューヨーク", "ノースカロライナ", "ノースダコタ", "北マリアナ諸島", "オハイオ", "オクラホマ", "オレゴン", "ペンシルベニア",
	"プエルトリコ", "ロードアイランド", " サウスカロライナ", "サウスダコタ", "テネシー", "テキサス", "米国バージン諸島", "ユタ", 
	"バーモント", "バージニア", "ワシントン", "ウェストバージニア", "ウィスコンシン", "ワイオミング"
];

_.stateFromAbbreviation = function( abbreviation ) {
	for ( var i = 0; i < _.stateAbbreviations.length; i++ ) {
		if ( abbreviation == _.stateAbbreviations[i] ) {
			return _.states[i];
		}
	}
}

_.translateState = function( state ) {
	if ( _.userSettings.language == "en-US" ) {
		return state;
	}
	for ( var i = 0; i < _.states.length; i++ ) {
		if ( state == _.states[i] ) {
			switch ( _.languageIndex() ) {
				case 1: {
					return _.translate.esTranslations[i];
				}
				case 2: {
					return _.translate.cnTranslations[i];
				}
				case 3: {
					return _.translate.frTranslations[i];
				}
				case 4: {
					return _.translate.jpTranslations[i];
				}
			}
		}
	}
}

_.languageIndex = function() {
	switch ( _.userSettings.language ) {
		// English is 0, Spanish is 1, Chinese is 2, French is 3, and Japanese is 4. In select0, the languages are not ordered
		// the same, but that won't matter; language and languageIndex() depend on the VALUE of
		// the selected option, and not on its position/index in select0.
		// For example, if the user selects French (option at position 2 in select0), languageIndex() will still 
		// return 3 regardless of the position of the selected option (2).
		case "en-US": {
			return 0;
		}
		case "es-ES": {
			return 1;
		}
		case "zh-CN": {
			return 2;
		}
		case "fr-FR": {
			return 3;
		}
		case "ja-JP": {
			return 4;
		}
		default: {
			return -1;
		}
	}
}