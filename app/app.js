var request = require('request');
var jsdom = require('jsdom');

process.setMaxListeners(0);

var championsList = {};
var processedChamps = 0;

getChampionsList();



function getChampionsList(){
	request( "http://ddragon.leagueoflegends.com/cdn/4.7.16/data/en_GB/champion.json", function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  		champions = JSON.parse( body ).data;
			for( champion_id in champions ){
				processedChamps++;
				var name = champions[ champion_id ].name;
				var linkID = champions[ champion_id ].id;
				championsList[ linkID ] = { name: name };
			}
			getChampionsRelations();
	    };
	});
}

function getChampionsRelations(){
	for( championName in championsList ){
		function closure( championName ){
			request("http://gameinfo.eune.leagueoflegends.com/en/game-info/champions/"+championName.toLowerCase(), function(error, response, body){
				if(!error && response.statusCode == 200) {
					var doc = jsdom.jsdom( body, null, { features: { FetchExternalResources: false, ProcessExternalResources: false } } );
					var document = doc.parentWindow.document;
					var relations = document.getElementsByClassName("champion-grid");

					if( relations.length != 0 ){
						var headers = document.getElementsByTagName("h3");
						var friends = false,
							rivals = false;
						for( var j = 0; j < headers.length; j++ ){
							if( headers[ j ].innerHTML == "Friends" ){
								friends = true;
							} else if( headers[ j ].innerHTML == "Rivals" ){
								rivals = true;
							}
						}

						if( friends ){
							var friendList = relations[ 0 ].getElementsByClassName("champ-name");
							championsList[ championName ].friends = [];
							for( var k = 0; k < friendList.length; k++ ){
								championsList[ championName ].friends.push( friendList[ k ].attributes.getNamedItem("data-rg-id").value );
							}
						}
					
						if( rivals ){
							var rivalList = relations[ friends? 1:0 ].getElementsByClassName("champ-name");
							championsList[ championName ].enemies = [];
							for( var k = 0; k < rivalList.length; k++ ){
								championsList[ championName ].enemies.push( rivalList[ k ].attributes.getNamedItem("data-rg-id").value );
							}
						}
					}
					processedChamps--;
						console.log( processedChamps );
					if( processedChamps == 0 )
						console.log( championsList );
				}
			});
		}

		closure( championName );
	}
}