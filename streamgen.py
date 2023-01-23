import random
from StreamBlock import *

# Patterns that start with a foot, and the next one starts with the left arrow
nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR']
# Patterns that start with a foot, and the next one starts with the right arrow
nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
# Patterns that start with left
startFromLeftPatterns = {'LDUR' : 25, 'LUDR' : 25, 'LDUDL' : 10, 'LUDUL' : 10, 'LUL' : 15, 'LDL' : 15}
# Yeah
startFromRightPatterns = {'RUDL' : 25, 'RDUL' : 25, 'RUDUR' : 10, 'RDUDR' : 10, 'RUR' : 15, 'RDR' : 15 }

arrowsDict = {'L' : '1000\n', 'D' : '0100\n', 'U' : '0010\n', 'R' : '0001\n'}
# Last N patterns (3 for now). If a pattern to be added is in this list, it is discarded
lastPatterns = ['X', 'X', 'X']	# Initialize with dummy values

# TODO: keep list of last N patterns, if the chosen pattern is in there discard it and choose another
# Might do a similar thing for right facing / left facing


def createStream(streamLength):
	
	nstream = StreamBlock(streamLength, 'L') # The next pattern must start with this arrow

	# TODO: pass currentDirection (now nextArrow) to chooseNextPattern?
	pattern = chooseNextPattern(startFromRightPatterns)	# TODO pass parameter(?)
	lastPatterns.insert(0, pattern)
	lastPatterns.pop()
	nstream.nextArrow = 'L' if (pattern[-1] == 'R') else 'R'
	nstream.length -= len(pattern)
	nstream.arrows += convertPatternToRows(pattern)

	while (nstream.length > 3):

		candleOrNot = random.randint(0, 4)

	# pattern has to be returned because different functions use it to determine the next pattern
		if candleOrNot == 0:	# Add candle
			print('adding candle')
			pattern = addCandle(pattern, nstream)				

		else:	# Add non-candle pattern
			pattern = addNonCandle(pattern, nstream)	# TODO: make global or create stream class
	
	print('stream:\n' + nstream.arrows)
	return nstream.arrows

# Some patterns have a higher weight than others, meaning they are more likely to be inserted into the stream (stairs lol)
def chooseNextPattern(patternDict):
	totalWeight = 100	# TODO make dynamic
	num = random.randint(0, totalWeight - 1)

	for pattern, weight in patternDict.items():
		if num < weight:
			return pattern

		num -= weight

# TODO: this should just *add* the pattern. Leave the direction stuff to something else
def addPattern(pattern, stream):
	lastPatterns.insert(0, pattern)
	lastPatterns.pop()
	stream.nextArrow = 'L' if (pattern[-1] == 'R') else 'R'
	stream.length -= len(pattern)
	stream.arrows += convertPatternToRows(pattern)

	return pattern

def addCandle(pattern, stream):
	secondToLastArrow = pattern[-2]
	
	if secondToLastArrow == 'U':
		stream.arrows += arrowsDict['D']
	if secondToLastArrow == 'D':
		stream.arrows += arrowsDict['U']

	stream.length -= 1

	# BUG (fixed): after adding addCandle and addNonCandle, I had to make them return the pattern that was added. ugly code

	if pattern in nextArrowLeftPatterns: # 'pattern' is the last added pattern
		pattern = chooseNextPattern(startFromRightPatterns)
	
	elif pattern in nextArrowRightPatterns:
		pattern = chooseNextPattern(startFromLeftPatterns)
	
	return addPattern(pattern, stream)

def addNonCandle(pattern, stream):
	pattern = chooseNextPattern(startFromLeftPatterns if (stream.nextArrow == 'L') else startFromRightPatterns)	

	while pattern in lastPatterns:
		pattern = chooseNextPattern(startFromLeftPatterns if (stream.nextArrow == 'L') else startFromRightPatterns)
	
	return addPattern(pattern, stream)	# TODO: make global or create stream class

# Converts the pattern strings (LUDL, etc) in a row to be added to the .sm file
def convertPatternToRows(pattern):
	lines = ''
	print('pattern = ' + pattern)

	for arrow in pattern:
		lines += arrowsDict[arrow]
	
	return lines


if __name__ == '__main__':

	chart = open('chart.sm', 'r+')
	streamblocks = [] # Line numbers where the streams begin?
	# OR store a pair of (beginningLine, #notes)

	lineCounter = 0; streamBegin = 0; streamCounter = 0; streamEnd = 0

	# TODO: Dict like (X, Y) where X is the line # where a stream block starts, Y is for how many rows or arrows
	# Ignore commas? or keep count somewhere, or 'learn' what type of stream it is by counting how many arrows are
	# between two commas and assume it's like that for the whole duration
	for i, line in enumerate(chart): # Read line given line #??
		lineCounter += 1

		if line == 'XXXX\n':	# For now only 1 stream
			streamCounter += 1

			if streamBegin == 0:	# TODO: Avoid this check every time, only required at the beginning of the stream. Probably already done
				streamBegin = i

			for j, liine in enumerate(chart):

				if liine == 'XXXX\n':
					streamCounter += 1
				
				else:
					streamEnd = i + j
					break
		

	print(streamCounter) # Ok but fix off-by-one
	print(streamBegin)
	print(streamEnd)
	createStream(streamCounter)