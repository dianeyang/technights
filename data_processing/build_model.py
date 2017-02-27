import json
import random
from collections import defaultdict

abbreviations = ['Ms.', 'Mrs.', 'Mr.', 'St.', 'S.P.E.W.']
terminal_punctuation = ['.', '?', '!', '."', '?"', '!"']
replacements = {
	u'\u201c': '',
	u'\u201d': '',
	u'\u2018': '\'',
	u'\u2019': '\'',
	u'\u00e9': 'e',
	'\"': '',
}

def word_ends_sentence(word):
	if word.endswith('...'):
		return False
	if word in abbreviations:
		return False
	for punctuation in terminal_punctuation:
		if word.endswith(punctuation):
			return True
	return False

def generate_text(start_states, data, end_states, order):
	current_state = random.choice(start_states.keys())
	text = current_state.split()
	while current_state not in end_states:
		next_word = random.choice(data[current_state].keys())
		text.append(next_word)
		current_state = ' '.join(text[-1 * order:])
	return ' '.join(text)


# Build Markov models for every order from 1 to 10.
for n in range(1, 5):
	# A mapping from a sequence of n words to words that come next and their frequencies.
	word_stats = defaultdict(lambda: defaultdict(int))
	start_states = defaultdict(int)
	end_states = []
	# Process each Harry Potter file
	file_name_format = 'harry_potter_cleaned/hp%d-cleaned.txt'
	for i in range(1, 8):
		file_name=  file_name_format % i
		with open(file_name, 'r') as infile:
			# Clean up text to only use ASCII
			text = infile.read()
			for old, new in replacements.iteritems():
				text = text.replace(old, new)
			# Remove tokens that are only punctuation
			words = filter(lambda s: any(c.isalpha() for c in s), text.split())

			# Split words into sentences
			sentences = []
			sentence_start = 0
			for j in range(len(words)-n):
				if word_ends_sentence(words[j]):
					sentences.append(words[sentence_start:j+1])
					sentence_start = j+1

			# Walk through each word in the sentence and update the word data
			for sentence in sentences:
				if len(sentence) < n:
					continue
				for k in range(n-1, len(sentence)):
					last_n_words = sentence[k-n+1:k+1]
					current_state = ' '.join(last_n_words)
					if k == n-1:
						start_states[current_state] += 1
					if k == len(sentence)-1:
						end_states.append(current_state)
					else:
						next_word = sentence[k+1]
						word_stats[current_state][next_word] += 1

	for i in range(10):
		print generate_text(start_states, word_stats, end_states, n)

	output = {}
	output['startStates'] = start_states
	output['endStates'] = end_states
	output['wordStats'] = word_stats

	# Write results to a json file
	output_file_name = '../json/hp-order-%d.json' % n
	with open(output_file_name, 'w') as outfile:
		outfile.write('var hp%d = ' % n)
		json.dump(output, outfile, indent=4, sort_keys=True)
	print "Done with order %d" % n
	print '----------'
