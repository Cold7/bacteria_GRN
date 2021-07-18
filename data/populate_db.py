from glob import glob
import pandas as pd
import mysql.connector
import urllib.request
from gtfparse import read_gtf
from os import system as s



if __name__ == "__main__":
	mydb = mysql.connector.connect(
		host="localhost",
		user="scontreras",
		password="mdem1522d1416ammgls",
		database="GRN"
	)
	mycursor = mydb.cursor()
	df = pd.read_csv("prokaryotes.csv")
	nets = glob("nets/*")
	gene_id = 1  #id for the gene table
	for net in nets:
		print(net)
		aux = net.split("/")[1].split("_")
		ID = aux[0]+"_"+aux[1]
		position = None
		for i in range(len(df['RefSeq FTP'])):
			if str(df['RefSeq FTP'][i]) != "nan":
				if ID in df['RefSeq FTP'][i]:
					position = i

		strain_id = None
		organism_id = None

		
		if position != None:
		#query if the strain is in the DB, if not, then we  will add to it
			sql = "SELECT * from strain WHERE strain_name = '"+df['Strain'][position]+"'"
			mycursor.execute(sql)
			myresult = mycursor.fetchall()
			
			if len(myresult) > 0 : #the strain is in the DB
				strain_id = myresult[0][0]
			else: #otherwise, the strain is not in the db, so we need to  write on it
				sql = "INSERT INTO strain (strain_name, refseq_ftp, genbank_ftp, assembly) VALUES ('"+df['Strain'][position]+"', '"+df['RefSeq FTP'][position]+"', '"+df['GenBank FTP'][position]+"', '"+df['Assembly'][position]+"')"
				mycursor.execute(sql)
				mydb.commit()
				#and qerying for the id
				sql = "SELECT * from strain WHERE strain_name = '"+df['Strain'][position]+"'"
				mycursor.execute(sql)
				myresult = mycursor.fetchall()
				strain_id = myresult[0][0]
			

		#query if the organism with the strain and phylum id is in the DB, if it is not in the table we will add to it
			org = df['#Organism Name'][position]
			if len(df['#Organism Name'][position].split(" ")) > 2:
				org = df['#Organism Name'][position].split(" ")[0]+" "+df['#Organism Name'][position].split(" ")[1]
			sql = "SELECT * from organism WHERE organism_name = '"+org+"'"
			mycursor.execute(sql)
			myresult = mycursor.fetchall()
			
			if len(myresult) > 0 : #the strain is in the DB
				organism_id = myresult[0][0]
			else: #otherwise, the strain is not in the db, so we need to  write on it
				sql = "INSERT INTO organism (organism_name,  strain_id) VALUES ('"+org+"','"+str(strain_id )+"')"
				mycursor.execute(sql)
				mydb.commit()
				#and qerying for the id
				sql = "SELECT * from organism WHERE organism_name = '"+org+"'"
				mycursor.execute(sql)
				myresult = mycursor.fetchall()
				organism_id = myresult[0][0]
			
		#downloading gene data and populate gene table
			#downloading GTF file

			gtfURL = df['RefSeq FTP'][position]+"/"+df['RefSeq FTP'][position].split("/")[-1]+"_genomic.gtf.gz"
			flag = False
			while flag == False:
				try:
					urllib.request.urlretrieve(gtfURL, "gtf.gz")
					flag = True
				except:
					print("problem with "+net+" attempting to reconect in 30s")
					sleep(30)
			#extracting gz
			s("gunzip -df gtf.gz")
			df2 = read_gtf("gtf")
			colnames = df2.columns
			k = 0
			
			while k < len(df2["seqname"]):
				if df2["gbkey"][k] == "Gene" :
					gene_name = df2["gene"][k].replace("'","")
					protein_id = df2["protein_id"][k+1].replace("'","")
					coord_init = str(df2["start"][k]).replace("'","")
					coord_end = str(df2["end"][k]).replace("'","")
					strand = df2["strand"][k].replace("'","")
					#print(gene_id, gene_name,protein_id, coord_init, coord_end, strand)
				#query if the gene is in the DB, if not, then we will add to it

					sql = "INSERT INTO gene (gene_id, original_gene_id, gene_name, protein_id, coord_init, coord_end, strand, organism_id) VALUES ('"+str(gene_id)+"', '"+df2["gene_id"][k]+"', '"+gene_name+"', '"+protein_id+"', '"+coord_init+"', '"+coord_end+"', '"+strand+"', '"+str(organism_id)+"')"
					try:
						mycursor.execute(sql)
						mydb.commit()
					except:
						print("problem inserting the gene "+gene_name+" with protein id "+protein_id+". the sql sentence is: ")
						print(sql)	
					gene_id += 1			
				k += 1
