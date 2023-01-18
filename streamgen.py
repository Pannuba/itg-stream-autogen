import random

# TODO: dict, where the value is the priority of the pattern? (e.g. stairs have higher priority than doritos)

# Patterns that start with a foot, and the next one starts with the left arrow
nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR']
# Patterns that start with a foot, and the next one starts with the right arrow
nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
# Patterns that start with left
startFromLeftPatterns = ['LDUR', 'LUDR', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
# Yeah
startFromRightPatterns = ['RUDL', 'RDUL', 'RUDUR', 'RDUDR', 'RUR', 'RDR']

arrowsDict = {'L' : '1000\n', 'D' : '0100\n', 'U' : '0010\n', 'R' : '0001\n'}


def createStream(streamLength):
	
	currentDirection = 'L';	# The next pattern must start with this arrow
	stream = ''
	firstArrowDone = 0

	while (streamLength > 3):

		print(currentDirection + ' ' + str(firstArrowDone))

		match random.randint(0, 2):

			case 0:	# Add candle
				if firstArrowDone:
					#lastArrow = pattern[-1]
					secondToLastArrow = pattern[-2]
					
					if secondToLastArrow == 'U':
						stream += arrowsDict['D']
					if secondToLastArrow == 'D':
						stream += arrowsDict['U']

					if pattern in nextArrowLeftPatterns:
						pattern = startFromRightPatterns[random.randint(0, 5)]
						currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
						streamLength -= len(pattern) + 1 # +1 because of the candle arrow
						stream += convertPatternToRows(pattern)
					
					elif pattern in nextArrowRightPatterns:
						pattern = startFromLeftPatterns[random.randint(0, 5)]
						currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
						streamLength -= len(pattern) + 1 # +1 because of the candle arrow
						stream += convertPatternToRows(pattern)
					
					firstArrowDone = 1


			case 1 | 2:	# Add non-candle pattern
				# Get random pattern from current direction
				# Case 2 and 3 are the same, so it's more likely to stay in the same direction
				#if firstArrowDone == 1:
				#	pattern = nextArrowLeftPatterns[random.randint(0, 5)] if (currentDirection == 'L') else nextArrowRightPatterns[random.randint(0, 5)]

				#else:
				pattern = startFromLeftPatterns[random.randint(0, 5)] if (currentDirection == 'L') else startFromRightPatterns[random.randint(0, 5)]

				currentDirection = 'L' if (pattern[-1] == 'R') else 'R'
				streamLength -= len(pattern)
				stream += convertPatternToRows(pattern)
				firstArrowDone = 0
	
	print('stream:\n' + stream)
	return stream


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