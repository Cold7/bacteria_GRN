<?php
	require "db.php";
	$display = "<select id='organism' class='form-control'>";
	$mysqli = new mysqli($host, $username, $password, $dbname);
	if ($mysqli->connect_errno) {
		echo "Error while connecting to mysql";
	}
	else {
		$query = "SELECT organism.organism_id, organism.organism_name, strain.strain_name, strain.assembly FROM organism INNER JOIN strain ON organism.strain_id = strain.strain_id ORDER BY organism.organism_name ASC";
		if ($result = $mysqli->query($query)){
			while ($row = $result->fetch_assoc()) {
				$display = $display ."<option value=".$row['organism_id'].">Organism: ".$row['organism_name']."; Strain: ".$row['strain_name']."; Assembly: ".$row['assembly']."</option>";			
			}
		}		
	}
	$display  = $display."</select>";
	echo $display;
	
?>
