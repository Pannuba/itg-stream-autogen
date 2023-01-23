class StreamBlock:

	def __init__(self, streamLength, nextArrow):
		self.arrows = '' # e.g. 1000\n0100\n0010\n0001
		self.length = streamLength
		self.nextArrow = nextArrow
		# add lastPattern, maybe last patterns list? lastPattern = lastPatternList[0]?