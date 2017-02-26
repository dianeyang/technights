for i in range(1,8):
	input_path = "./harry_potter/hp%d.txt" % i
	output_path = "./harry_potter_cleaned/hp%d-cleaned.txt" % i
	current_page = 1
	drop_cap = None
	with open(input_path, "r") as infile, open(output_path, "w") as outfile:
		for line in infile:
			stripped = line.strip()
			if len(stripped) == 0:
				continue
			# glue drop cap onto front of next non-empty line
			if drop_cap != None and len(stripped) > 0:
				stripped = drop_cap + stripped
				drop_cap = None
			# remove chapter labels and titles
			if stripped.isupper():
				# if character is a drop cap, save it to be added to the next line
				if len(stripped) == 1:
					drop_cap = stripped
				continue
			# remove page numbers
			if stripped == str(current_page):
				current_page += 1
				continue
			outfile.write(stripped + "\n")
