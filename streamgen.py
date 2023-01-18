import random

# TODO: dict, where the value is the priority of the pattern? (e.g. stairs have higher priority than doritos)

# Patterns that start with a foot, and the next one starts with the left arrow
nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR']
# Patterns that start with a foot, and the next one starts with the right arrow
nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
# Patterns that start with left
startFromLeftPatterns = {'LDUR' : 25, 'LUDR' : 25, 'LDUDL' : 10, 'LUDUL' : 10, 'LUL' : 15, 'LDL' : 15}
# Yeah
startFromRightPatterns = {'RUDL' : 25, 'RDUL' : 25, 'RUDUR' : 10, 'RDUDR' : 10, 'RUR' : 15, 'RDR' : 15 }

arrowsDict = {'L' : '1000\n', 'D' : '0100\n', 'U' : '0010\n', 'R' : '0001\n'}


def createStream(streamLength):
	
	currentDirection = 'L';	# The next pattern must start with this arrow
	stream = ''
	firstArrowDone = 0

	while (streamLength > 3):

		print(currentDirection + ' ' + str(firstArrowDone))

		candleOrNot = random.randint(0, 4)

		if candleOrNot == 0:	# Add candle
			if firstArrowDone:
				#lastArrow = pattern[-1]
				secondToLastArrow = pattern[-2]
				
				if secondToLastArrow == 'U':
					stream += arrowsDict['D']
				if secondToLastArrow == 'D':
					stream += arrowsDict['U']

				if pattern in nextArrowLeftPatterns: # 'pattern' is the last added pattern
					pattern = chooseNextPattern(startFromRightPatterns)
					currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
					streamLength -= len(pattern) + 1 # +1 because of the candle arrow
					stream += convertPatternToRows(pattern)
				
				elif pattern in nextArrowRightPatterns:
					pattern = chooseNextPattern(startFromLeftPatterns)
					currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
					streamLength -= len(pattern) + 1 # +1 because of the candle arrow
					stream += convertPatternToRows(pattern)
				
				firstArrowDone = 1


		else:	# Add non-candle pattern
			pattern = chooseNextPattern(startFromLeftPatterns if (currentDirection == 'L') else startFromRightPatterns)
			currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
			streamLength -= len(pattern)
			stream += convertPatternToRows(pattern)
			firstArrowDone = 1
	
	print('stream:\n' + stream)
	return stream

# Some patterns have a higher weight than others, meaning they are more likely to be inserted into the stream (stairs lol)
def chooseNextPattern(patternDict):
	totalWeight = 100
	num = random.randint(0, totalWeight - 1)

	for pattern, weight in patternDict.items():
		if num < weight:
			return pattern

		num -= weight

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
	# TODO: Make class for a block of stream?
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