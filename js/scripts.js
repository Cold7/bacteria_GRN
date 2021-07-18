var cy="";
var nodeDict = {};//node dict id:{coord init, coord end, strand, gene_name, protein_id}
var edgeDict = {};//edge dict id:{}
var visualizedNodes = [];
var visualizedEdges = [];
var currentOrganism = ""; // to reload the network
var element = ""; //element to perform a download button

//function to determine if a node is linked to other or not
function connectedOrNot(nodeID){
	for(var key in edgeDict){
		var nodes = key.split("_");
		if (nodeID == nodes[0]){
			return true;
		}
		if(nodeID == nodes[1]){
			return true;
		}
	}
	return false;
}
//function to make visible a div
function displayDiv(div)
{
	$("#about").hide();
	$("#filter").hide();
	$("#download").hide();
	$("#help").hide();
	$("#"+div).show();
 
}
//function to init the cy variable
function initCy() {
	var cyto = cytoscape({
		container: document.getElementById('netView'),
		style: [
			{
				selector:'node',
				style:{
					'label': 'data(name)',
					'background-color': '#94B0DA',
				}
			},
			{
				selector:'edge',
				style:{
					'width': 1,
					'curve-style': 'bezier',
					'target-arrow-shape': 'triangle',
				}
			}
		]
	});	
	return cyto;
}
//function to load network
function loadNetwork()
{
	currentOrganism  = $("#organism").val();
	$('#modal_loading').modal('show'); 
	var htmlNodeTable = "";//html code for the node table
	var htmlEdgeTable = "";//html code for the node table
	visualizedNodes = [];
	visualizedEdges = [];
	$("#netView").html("Loading network...");
	$("#netView").html("");
	$("#nodeTBody").html("");
	$("#edgeTBody").html("");
	cy= initCy();
	nodeDict = {}; 
	edgeDict = {}; 
	//querying nodes
	$( document ).ready(function() {
        $.ajax({
            type: "POST",
            url: 'pages/php/query_nodes.php',
            data: {id:$("#organism").val()},
            success: function(response)
            {
				var data = response.split("<br>");
				
				for (var i = 0; i < data.length; i++){
					var element = data[i].split(" ");
					if(element != ""){
						
						var name = "";
						if (element[4] != ""){
							name = element[4];
						}	
						else if(element[5] != ""){
							name = element[5];
						}
						else{
							name = element[6];
							
						}
						try {
							if(name != ""){
								if(visualizedNodes.includes(element[0]) == false){
									cy.add({group: 'nodes',	data: { id: element[0], name:name}, position: { x: 500, y: 250 } });
									visualizedNodes.push(element[0]);
									nodeDict[element[0]] = {"id":element[0],"coord_init":element[1], "coord_end":element[2],"strand":element[3], "gene_name":element[4], "protein_id":element[5], "original_gene_id":element[6],"name":name};
								}
								
							}
						}catch (e){
							alert(e);
						}
						htmlNodeTable += "<tr><th><input class='form-check-input' type='checkbox' id='"+element[0]+"'></th><th>"+element[6]+"</th><th>"+element[4]+"</th><th>"+element[5]+"</th><th>"+element[1]+"</th><th>"+element[2]+"</th><th>"+element[3]+"</th></tr>";
					}
				}
				if($("#loadUnconnectedNodes").prop('checked')  == true){
					$("#nodeTBody").html(htmlNodeTable);
				}
				$.ajax({
					type: "POST",
					url: 'pages/php/query_edges.php',	
					data: {id:$("#organism").val()},
					success: function(response) {

						var data = response.split("<br>");
						for(var i = 0; i< data.length; i++){
							var element = data[i].split(" ");
							if (element != ""){
								edgeDict[element[0]+"_"+element[1]] = {"edge_type":element[2], "target_strand":element[3]};
								try {//try catch statement due I have all the edges including other organisms
									cy.add({ group: 'edges', data: { id: element[0]+"_"+element[1], source: element[0], target: element[1]}});
									if(visualizedEdges.includes(element[0]+"_"+element[1]) == false){
										visualizedEdges.push(element[0]+"_"+element[1]);
									}
									
									htmlEdgeTable += "<tr><th><input class='form-check-input' type='checkbox' id='"+element[0]+"_"+element[1]+"'></th><th>"+nodeDict[element[0]]["name"]+"</th><th>"+nodeDict[element[1]]["name"]+"</th><th>"+nodeDict[element[0]]["name"]+" (interact) "+nodeDict[element[1]]["name"]+"</th><th>"+element[2]+"</th><th>"+element[3]+"</th></tr>";
								} catch (e){
								}
							}
						}
						
						$("#edgeTBody").html(htmlEdgeTable);
						//Now I know which genes are linked, so if the option of load disconected nodes is unselected, then I will delete them from the visualization and from the nodeDict
						if($("#loadUnconnectedNodes").prop('checked')  == false){
							//looping in the node dict, then loop over all edges and if it is not in the edge dict, then the node is disconected, so we will delete from the cy object, adding to a temporal list and finally deleting all elements from the temp list
							var nodesToDelete = []
							for (var nodeKey in nodeDict){
								var deleteNode = connectedOrNot(nodeKey);
								if (deleteNode == false){
									//deleting from cy obj and adding to a list to delete from visualizedNodes and nodeDict
									nodesToDelete.push(nodeKey);
								}
							}
							//deleting nodes in list from nodeDict and from visualizedNodes

							for (var i = 0; i < nodesToDelete.length; i++){
								delete nodeDict[nodesToDelete[i]];
								var index = visualizedNodes.indexOf(nodesToDelete[i]);
								if (index > -1) {
									visualizedNodes.splice(index, 1);
								}
							}
							
							htmlNodeTable = "";
							
							//reinitializing cy object and plotting visible nodes and edges
							cy= initCy();
							for (var key in nodeDict){
								cy.add({group: 'nodes',	data: { id: key, name:nodeDict[key]["name"]}, position: { x: 500, y: 250 } });
								htmlNodeTable += "<tr><th><input class='form-check-input' type='checkbox' id='"+key+"'></th><th>"+nodeDict[key]["original_gene_id"]+"</th><th>"+nodeDict[key]["gene_name"]+"</th><th>"+nodeDict[key]["protein_id"]+"</th><th>"+nodeDict[key]["coord_init"]+"</th><th>"+nodeDict[key]["coord_end"]+"</th><th>"+nodeDict[key]["strand"]+"</th></tr>";
							}
							$("#nodeTBody").html(htmlNodeTable);
							for (var key in edgeDict){
								try {//try catch statement due I have all the edges including other organisms
									elements = key.split("_");
									cy.add({ group: 'edges', data: { id: element[0]+"_"+element[1], source: element[0], target: element[1]}});
								} catch (e){
								}							
							}
						}
						$("#networkLayout").show();	
						downloadNetButton();
						$('#modal_loading').modal('hide'); 					
					},
					error : function (response) {
						alert("Problem loading edges");
					}									
				});
           },
           error : function (response) {
				alert("Problem loading network");
		   },

       });		
	});	
	
}

function applyLayout(){

	try{
		var layout = cy.layout({
			name: $("#layout").val(),
			idealEdgeLength: 100,
			nodeOverlap: 20,
			refresh: 20,
			fit: true,
			padding: 30,
			randomize: false,
			componentSpacing: 100,
			nodeRepulsion: 400000,
			edgeElasticity: 100,
			nestingFactor: 5,
			gravity: 80,
			numIter: 1000,
			initialTemp: 200,
			coolingFactor: 0.95,
			minTemp: 1.0
		});
		layout.run();
	}catch (e){}
}
//function to display selected edges
function selectedEdges(){
	visualizedNodes = [];
	visualizedEdges = [];
	var log = "";
	var idSelectedEdges = [];
	var nodesList = [];
	for (var key in edgeDict) {
		if($("#"+key).prop('checked')){
			idSelectedEdges.push(key);
		}
	}
	cy = initCy();
	//adding nodes
	for (var i = 0; i<idSelectedEdges.length; i++){
		var nodes = idSelectedEdges[i].split("_");
		try {
			cy.add({group: 'nodes',	data: { id: nodes[0], name:nodeDict[nodes[0]]["name"]}, position: { x: 500, y: 250 } });
			if(visualizedNodes.includes(nodes[0]) == false){
				visualizedNodes.push(nodes[0]);
			}
			
		}catch (e){}
		try {
			cy.add({group: 'nodes',	data: { id: nodes[1], name:nodeDict[nodes[1]]["name"]}, position: { x: 500, y: 250 } });
			if(visualizedNodes.includes(nodes[1]) == false){
				visualizedNodes.push(nodes[1]);
			}
			
		}catch (e){}
		try {
			cy.add({ group: 'edges', data: { id: nodes[0]+"_"+nodes[1], source: nodes[0], target: nodes[1]}});
			if(visualizedEdges.includes(nodes[0]+"_"+nodes[1]) == false){
				visualizedEdges.push(nodes[0]+"_"+nodes[1]);
			}			
		}catch (e){}
	}
	downloadNetButton();

	
}

//function to display selected nodes
function selectedNodes(){
	visualizedNodes = [];
	visualizedEdges = [];
	var idSelectedNodes = [];
	for (var key in nodeDict) {
		if($("#"+key).prop('checked')){
			idSelectedNodes.push(key);
		}
	}
	cy = initCy();
	//adding nodes
	for (var i = 0; i<idSelectedNodes.length; i++){
		try {
			cy.add({group: 'nodes',	data: { id: nodeDict[idSelectedNodes[i]]["id"], name:nodeDict[idSelectedNodes[i]]["name"]}, position: { x: 500, y: 250 } });
			if(visualizedNodes.includes(nodeDict[idSelectedNodes[i]]["id"]) == false){
				visualizedNodes.push(nodeDict[idSelectedNodes[i]]["id"]);
			}
			
		}catch (e){}
	}
	//adding edges
	for (var i = 0; i<idSelectedNodes.length; i++){
		for (var j = 0; j<idSelectedNodes.length; j++){
			var edgeID  = nodeDict[idSelectedNodes[i]]["id"]+"_"+nodeDict[idSelectedNodes[j]]["id"];
			if (edgeID in edgeDict){
				cy.add({ group: 'edges', data: { id: edgeID, source: nodeDict[idSelectedNodes[i]]["id"], target: nodeDict[idSelectedNodes[j]]["id"]}});
				if(visualizedEdges.includes(edgeID) == false){
					visualizedEdges.push(edgeID);
				}
			}
		}
	}
	downloadNetButton();
	
}
//function to display selected nodes and connecting edges
function selectedNodesAllEdges(){
	visualizedNodes = [];
	visualizedEdges = [];
	
	var idSelectedNodes = [];
	var nodesToConnect = []
	for (var key in nodeDict) {
		if($("#"+key).prop('checked')){
			idSelectedNodes.push(key);
		}
	}
	
	for (var i = 0; i<idSelectedNodes.length; i++){
		for (var key in edgeDict){			
			var nodes = key.split("_");
		//	if (nodes[0]+"_"+nodes[1] == "11527_11528"){
			//	console.log(key);
		//	}
			if (idSelectedNodes[i] == nodes[0]) {
				//if the node not in the idSelectedNodes, we will add the node to a list. we include the "1" due we have one of them and the other one is not saved
				if (idSelectedNodes.includes(nodes[1]) == false){
					if (nodesToConnect.includes(nodes[1]) == false){
						nodesToConnect.push(nodes[1])
					}
				}
			}
			
			if (idSelectedNodes[i] == nodes[1]) {
				//if the node not in the idSelectedNodes, we will add the node to a list. we include the "0" due we have one of them and the other one is not saved
				if (idSelectedNodes.includes(nodes[0]) == false){
					if (nodesToConnect.includes(nodes[0]) == false){
						nodesToConnect.push(nodes[0])
					}
				}
			}
			
		}
	}

	var allNodes = idSelectedNodes.concat(nodesToConnect);
	
	//adding nodes
	cy = initCy();
	for (var i = 0; i<allNodes.length; i++){
		try {
			cy.add({group: 'nodes',	data: { id: nodeDict[allNodes[i]]["id"], name:nodeDict[allNodes[i]]["name"]}, position: { x: 500, y: 250 } });
			if(visualizedNodes.includes(nodeDict[allNodes[i]]["id"]) == false){
				visualizedNodes.push(nodeDict[allNodes[i]]["id"]);
			}
			
		}catch (e){}
	}

	//adding edges
	for (var i = 0; i<allNodes.length; i++){
		for (var j = 0; j<allNodes.length; j++){
			var edgeID  = nodeDict[allNodes[i]]["id"]+"_"+nodeDict[allNodes[j]]["id"];
			if (edgeID in edgeDict){
				cy.add({ group: 'edges', data: { id: edgeID, source: nodeDict[allNodes[i]]["id"], target: nodeDict[allNodes[j]]["id"]}});
				if(visualizedEdges.includes(edgeID) == false){
					visualizedEdges.push(edgeID);
				}
			}
		}
	}
	downloadNetButton();
	
}
//function to call other functions in order of the selection option
function applyOption(){
	if($("#additional").val() == "1"){
		selectedEdges();
	}
	if($("#additional").val() == "2"){
		selectedNodes();
	}
	if($("#additional").val() == "3"){
		selectedNodesAllEdges();
	}

}

//function to make a  download previsualized network button
function downloadNetButton(){

	var currentNodesInEdges = [];
	var netToDownload = "id 1,NCBI_id_1,gene name  1,protein name 1,gene1_coord. 1,gene1_coord. 2,strand gene 1, id 2, NCBI_id_2,gene name  2,protein name 2, gene2_coord. 1,gene2_coord. 2,strand gene 2,edge type,target strand\n";
	
	//adding information of the edges
	for(var i = 0; i < visualizedEdges.length; i++){
		var nodes = visualizedEdges[i].split("_");
		
		if(currentNodesInEdges.includes(nodes[0]) == false){
			currentNodesInEdges.push(nodes[0]);
		}
		if(currentNodesInEdges.includes(nodes[1]) == false){
			currentNodesInEdges.push(nodes[1]);
		}
		
		netToDownload += nodeDict[nodes[0]]["id"]+","+nodeDict[nodes[0]]["original_gene_id"]+","+nodeDict[nodes[0]]["gene_name"]+","+nodeDict[nodes[0]]["protein_id"]+","+nodeDict[nodes[0]]["coord_init"]+","+nodeDict[nodes[0]]["coord_end"]+","+nodeDict[nodes[0]]["strand"]+","+nodeDict[nodes[1]]["id"]+","+nodeDict[nodes[1]]["gene_name"]+","+nodeDict[nodes[1]]["original_gene_id"]+","+nodeDict[nodes[1]]["protein_id"]+","+nodeDict[nodes[1]]["coord_init"]+","+nodeDict[nodes[1]]["coord_end"]+","+nodeDict[nodes[1]]["strand"]+","+edgeDict[nodes[0]+"_"+nodes[1]]["edge_type"]+","+edgeDict[nodes[0]+"_"+nodes[1]]["target_strand"]+"\n";
	}
	
	//adding nodes unconnected
	for(var i = 0; i < visualizedNodes.length; i++){
		if(currentNodesInEdges.includes(visualizedNodes[i]) == false){
			netToDownload += nodeDict[visualizedNodes[i]]["id"]+","+nodeDict[visualizedNodes[i]]["original_gene_id"]+","+nodeDict[visualizedNodes[i]]["gene_name"]+","+nodeDict[visualizedNodes[i]]["protein_id"]+","+nodeDict[visualizedNodes[i]]["coord_init"]+","+nodeDict[visualizedNodes[i]]["coord_end"]+","+nodeDict[visualizedNodes[i]]["strand"]+"\n";
		}
	}
	//creating button to download file
	element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(netToDownload));
	element.setAttribute('download', "net.csv");
	
	element.style.display = 'none';


	
	
	//document.body.removeChild(element);

	
}

//function to paint node
function paintNode(){
	var selectedColor = $("#node_color").val();
	var selectedShape = $("#node_shape").val();
	for (var i = 0; i < visualizedNodes.length; i++){
		if($("#"+visualizedNodes[i]).prop('checked')){
			cy.nodes('[id = "'+visualizedNodes[i]+'"]').style('background-color', selectedColor);
			if(selectedShape != ""){
				cy.nodes('[id = "'+visualizedNodes[i]+'"]').style('shape', selectedShape);
			}
		}
	}
}

//function to paint edge
function paintEdge(){
	var selectedColor = $("#edge_color").val();
	for (var i = 0; i < visualizedEdges.length; i++){
		if($("#"+visualizedEdges[i]).prop('checked')){
			cy.edges('[id = "'+visualizedEdges[i]+'"]').style('line-color', selectedColor);
			cy.edges('[id = "'+visualizedEdges[i]+'"]').style('target-arrow-color', selectedColor);
		}
	}
}


//function to select nodes
function selectNodes(){
	//unselect all nodes
	for(var key in nodeDict){
		$('#'+key).prop('checked', false);
	}
	//getting the parameter to search, property and if it is or contain
	var parameter = $("#searchNode").val();
	var property = $("#node_property_search").val();
	var isOrContain = $("#node_condition_search").val();

	//looping over all nodes
	for(var key in nodeDict){
		var currentProperty = nodeDict[key][property]; //property was taken from the html, and its value is the same as in the nodeDict
		if (isOrContain == "is"){
			if(currentProperty == parameter){
				$('#'+key).prop('checked', true);
			}
			
		}
		else{
			if(currentProperty.includes(parameter)){
				$('#'+key).prop('checked', true);
			}
		}
	}
	alert("Done");
	
}

//to select all nodes
function selectAllNodes(){
	for(var key in nodeDict){
		$('#'+key).prop('checked', true);
	}
	alert("done");
}
//to select all edges
function selectAllEdges(){
	for(var key in edgeDict){
		$('#'+key).prop('checked', true);
	}
	alert("done");
}
//to unselect all nodes
function unselectAllNodes(){
	for(var key in nodeDict){
		$('#'+key).prop('checked', false);
	}
	alert("done");
}
//to unselect all edges
function unselectAllEdges(){
	for(var key in edgeDict){
		$('#'+key).prop('checked', false);
	}
	alert("done");
}

//function to select edges
function selectEdges(){
	//unselect all edges
	for(var key in edgeDict){
		$('#'+key).prop('checked', false);
	}
	//getting the parameter to search, property and if it is or contain
	var parameter = $("#searchEdge").val(); //string to search
	var property = $("#edge_search_property").val(); //e.g source node, ... , edge type
	var isOrContain = $("#edge_search_condition").val();


	//looping over all edges
	for(var key in edgeDict){
		var currentProperty = "";
		nodes = key.split("_");
		if (property == "edge_name"){
			
			try{ //try catch statement due I have all the edges including other organisms
				currentProperty = nodeDict[nodes[0]]["name"]+" (interact) "+nodeDict[nodes[1]]["name"];
			}catch (e){}
		}
		else if(property == "source_node"){
			try{ //try catch statement due I have all the edges including other organisms
				currentProperty = nodeDict[nodes[0]]["name"];

			}catch (e){}
		}
		else if (property == "target_node"){
			try{ //try catch statement due I have all the edges including other organisms
				currentProperty = nodeDict[nodes[1]]["name"];
			}catch (e){}
		}
		else{ //type of edge
			currentProperty = edgeDict[key][property]; //property was taken from the html, and its value is the same as in the edgeDict
		}
		if (currentProperty != ""){
			if (isOrContain == "is"){
				if(currentProperty == parameter){
					$('#'+key).prop('checked', true);
				}
			
			}
			else{
				if(currentProperty.includes(parameter)){
					$('#'+key).prop('checked', true);
				}
			}
		}
	}
	
	alert("Done");
}


//function to center network
function centerNetwork(){
	cy.center();
}

//function to fit  network

function fitNetwork(){
	cy.fit();
}

//function to reload the visualization
function resetNetworkView(){
	cy.reset();
}
