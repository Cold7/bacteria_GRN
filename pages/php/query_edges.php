<?php
	require "db.php";
	$display = "";
	$id = $_POST["id"];
	$mysqli = new mysqli($host, $username, $password, $dbname);
	if ($mysqli->connect_errno) {
		echo "Error while connecting to mysql";
	}
	else {
		//$query = "SELECT organism.organism_id, organism.organism_name, strain.strain_name, organism.assembly FROM organism INNER JOIN strain ON organism.strain_id = strain.strain_id";
		$query  = "SELECT edge.gene_id1, edge.gene_id2, edge_type.type, edge.target_strand FROM edge INNER JOIN edge_type ON edge.edge_type_id = edge_type.edge_type_id INNER JOIN gene ON gene.gene_id = edge.gene_id1 WHERE gene.organism_id = ".$id." ORDER BY edge.gene_id1 ASC, edge.gene_id2 ASC";
		if ($result = $mysqli->query($query)){
			while ($row = $result->fetch_assoc()) {
				$display .= $row['gene_id1']." ".$row['gene_id2']." ".$row['type']." ".$row['target_strand']."<br>";//$display ."<option value=".$row['organism_id'].">Organism: ".$row['organism_name']."; Strain: ".$row['strain_name']."; Assembly: ".$row['assembly']."</option>";			
			}
		}		
	}
	echo $display;
	
?>
