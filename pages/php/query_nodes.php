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
		$query  = "SELECT gene.gene_id, gene.original_gene_id, gene.coord_init, gene.coord_end, gene.strand, gene.gene_name, gene.protein_id FROM gene WHERE organism_id = ".$id." ORDER BY gene.gene_name ASC";

		if ($result = $mysqli->query($query)){
			while ($row = $result->fetch_assoc()) {
				$display .= $row['gene_id']." ".$row['coord_init']." ".$row['coord_end']." ".$row['strand']." ".$row['gene_name']." ".$row['protein_id']." ".$row['original_gene_id']."<br>";//$display ."<option value=".$row['organism_id'].">Organism: ".$row['organism_name']."; Strain: ".$row['strain_name']."; Assembly: ".$row['assembly']."</option>";			
			}
		}		
	}
	echo $display;
	
?>
