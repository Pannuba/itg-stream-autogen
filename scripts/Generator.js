const startFromLeftPatterns  = {'LDUR' : 25, 'LUDR' : 25, 'LDUDL' : 6, 'LUDUL' : 6, 'LUL' : 19, 'LDL' : 19}
const startFromRightPatterns = {'RUDL' : 25, 'RDUL' : 25, 'RUDUR' : 6, 'RDUDR' : 6, 'RUR' : 19, 'RDR' : 19}
const rightFacingPatterns = ['LDUR', 'LDL', 'RUR', 'RUDL', 'LDUDL', 'RUDUR']
const leftFacingPatterns  = ['RDUL', 'RDR', 'LUL', 'LUDR', 'RDUDR', 'LUDUL']
const candleDownDict = {'D' : 10, 'DU' : 80, 'DUD' : 10 }
const candleUpDict   = {'U' : 10, 'UD' : 80, 'UDU' : 10 }
const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}
//tot% double candle = 10 + 80/4 + 10 = 10 + 20 + 10 = 40% (was 40 + 40/3 + 20 = 73.3%)
//tot% single candle = (80*3)/4 = 60% (was 40*2/3 = 26.6%)


class Generator {

	constructor(stream, options)
	{
		this.stream = stream;
		this.options = options;
	}

	generateStream()
	{
		// Doesn't have to be precise, not a problem if it generates more than needed
		var arrowsToGenerate = this.stream.measures * this.options["quantization"]; // TODO(?): move in StreamBlock class

		this.addNonCandle();	// First pattern can't be a candle

		while (arrowsToGenerate > 0)
		{
			// TODO: implement random thing like tetris where after every n ALWAYS pick candle
			if (Math.floor(Math.random() * this.options["candleDens"]))	// if 0 candle, if != 0 no
				this.addNonCandle();
			
			else
				this.addCandle();

			arrowsToGenerate -= this.stream.lastPatterns[0].length;
		}

		return stream;
	}

	addNonCandle()
	{
		var pattern = "";
		
		console.log("adding no");

		if (!Math.floor(Math.random() * this.options["anchorDens"]))	// Randomly add L/R before adding the pattern, creates non-candle L/R anchors
		{
			if (this.stream.nextArrow == 'L')
			{
				this.stream.arrows.push("1000");
				this.stream.nextArrow = 'R';
			}

			else
			{
				this.stream.arrows.push("0001");
				this.stream.nextArrow = 'L';
			}
			
			do {
				pattern = this.chooseNextPattern((this.stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)
			} while (this.stream.lastPatterns.includes(pattern) || pattern.length == 3)	// Prevent excessively long anchors. Could also check last pattern != 3 in upper if...
		}
	
		else
		{
			do {
				pattern = this.chooseNextPattern((this.stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
			} while (this.stream.lastPatterns.includes(pattern) || pattern == this.mirrorBoth(this.stream.lastPatterns[0])) // Second condition prevents for example double right facing dorito)
		}
		
		if ((rightFacingPatterns.includes(pattern) && this.stream.lastDirections.every(dir => dir == 'R')) || (leftFacingPatterns.includes(pattern) && this.stream.lastDirections.every(dir => dir == 'L')))
		{
			pattern = this.mirrorVertically(pattern);
		}

		if (pattern.length == 5 && !Math.floor(Math.random() * this.options["anchorDens"]))
		{
			this.processPattern(pattern, stream);
			
			this.stream.arrows.pop(); // Remove dorito's last arrow
			var direction = this.getDirection(pattern);

			do {
				pattern = this.chooseNextPattern((this.stream.nextArrow == 'R') ? startFromLeftPatterns : startFromRightPatterns)	
			} while (pattern.length != 4 || direction != this.getDirection(pattern))
		}

		else if (pattern.length == 4 && !Math.floor(Math.random() * 12))	// Without "else", it can put a triangle right after an U/D anchor, facing the same direction -> bad
		{																	// If stair, make big triangle . push stair now into stream, remove last arrow, pattern becomes the other stair
			this.processPattern(pattern, stream);
			
			this.stream.arrows.pop(); // Remove stair's last arrow
			var direction = this.getDirection(pattern);

			// add stair facing same direction but starting from opposite arrow. Pattern is added at the end of function, very ugly, make sth like pushPattern()

			do {// TODO put this do/while check in chooseNextPattern, pass condition in while?? YES PERFECT
				pattern = this.chooseNextPattern((this.stream.nextArrow == 'R') ? startFromLeftPatterns : startFromRightPatterns)	
			} while (pattern.length != 4 || direction != this.getDirection(pattern))
		}

		this.processPattern(pattern, stream);
		
		return stream;
	}

	addCandle()
	{
		var pattern = "";

		var lastArrow = (this.stream.nextArrow == 'R' ? 'L' : 'R');
		var secondToLastArrow = this.stream.lastPatterns[0].slice(-2, -1), candlePattern;

		(secondToLastArrow == 'U') ? candlePattern = this.chooseNextPattern(candleDownDict) : candlePattern = this.chooseNextPattern(candleUpDict);


		// call process pattern with ludr, build pattern using last arrow+candlepattern+nextarrow
		if (candlePattern.length == 2)	// 80% of the time
		{

			if (Math.floor(Math.random() * 4) && !this.options['wtfMode'])	// 3/4ths of the time single candle. Skips for wtf mode
			{
				console.log("adding single candle");

				this.stream.arrows.pop(); // remove last arrow because it's going to be repeated (full pattern will be added e.g LUDR instead of UDR)
				pattern = lastArrow + candlePattern + this.stream.nextArrow;	// Basically a stair
			}
			
			else	// 1/4th of DU/UD candles are double
			{
				console.log("adding double candle");
				// For double candles I push in the stream without calling processPattern so "pattern" is a basic one
				this.convertPatternToList(candlePattern).forEach(arrow => {
					this.stream.arrows.push(arrow);
				});

				do {
					pattern = this.chooseNextPattern(this.stream.nextArrow == 'L' ? startFromLeftPatterns : startFromRightPatterns);
				} while (pattern[1] == candlePattern[1]);

			}
		}
		
		else	// 20% of the time (10% U/D, 10% UDU/DUD)
		{
			this.convertPatternToList(candlePattern).forEach(arrow => {
				this.stream.arrows.push(arrow);
			});

			if (Math.floor(Math.random() * this.options["anchorDens"]))	// 1 - 1/anchDens times it's a double candle
			{
				console.log("adding double candle");

				do {
					pattern = this.chooseNextPattern(this.stream.nextArrow == 'L' ? startFromRightPatterns : startFromLeftPatterns);
				} while ((candlePattern.length == 3 && pattern[1] == candlePattern[2]) ||	// pattern[1] check prevents ugly ass patterns which may actually be ok for O.A.S. add option?
				         (candlePattern.length == 1 && (pattern.length == 3 || pattern[1] == candlePattern)));
			}

			else	// 1/anchDens times, U/D anchor. Does NOT skip for wtf mode because anchors funni
			{
				console.log("adding candle anchor (double or single)");

				do {
					pattern = this.chooseNextPattern(this.stream.nextArrow == 'L' ? startFromRightPatterns : startFromLeftPatterns);
				} while ((candlePattern.length == 3 && (pattern[1] != candlePattern[2] || pattern.length != 4)) ||	// If UDU/DUD candle, I want a stair that makes an U/D anchor
				         (candlePattern.length == 1 && (pattern.length != 3 || pattern[1] == candlePattern))    );	// If U/D candle, I want a L/R anchor double candle. 3rd check removes towers. Option?
			}
		}

		this.processPattern(pattern, stream);
		
		return stream;
	}
	
	// LDUR becomes LUDR, RDR becomes RUR
	mirrorVertically(pattern)
	{
		return pattern.replaceAll('U', 'X').replaceAll('D', 'U').replaceAll('X', 'D');
	}

	// LDUR becomes RDUL, RDR becomes LDL
	mirrorHorizontally(pattern)
	{
		return pattern.replaceAll('R', 'X').replaceAll('L', 'R').replaceAll('X', 'L');
	}

	// LDUR becomes RUDL, RDR becomes LUL
	mirrorBoth(pattern)
	{
		return this.mirrorVertically(this.mirrorHorizontally(pattern));
	}

	getDirection(pattern)
	{
		return (rightFacingPatterns.includes(pattern) ? 'R' : 'L');
	}

	// Writes pattern to stream, gets nextArrow, adds to lastPatterns list
	processPattern(pattern)
	{
		this.stream.lastPatterns.unshift(pattern);
		this.stream.lastPatterns.pop(); // Keep the list with the same amount of elements

		this.stream.lastDirections.unshift(rightFacingPatterns.includes(pattern) ? 'R' : 'L');
		this.stream.lastDirections.pop();
		
		console.log(pattern);

		(pattern.slice(-1) == 'R') ? this.stream.nextArrow = 'L' : this.stream.nextArrow = 'R';

		this.convertPatternToList(pattern).forEach(arrow => {
			this.stream.arrows.push(arrow);
		});
	}

	chooseNextPattern(patternDict)
	{
		var num = Math.floor(Math.random() * (100 - 1));	// 100 is the total weight

		for (const [pattern, weight] of Object.entries(patternDict))
		{
			if (num < weight) return pattern;

			num -= weight;
		}

		return null;
	}

	// Converts "LUDL" to ["1000", "0100", "0010", "0001"]
	convertPatternToList(pattern)
	{
		var list = [];

		for (const arrow of pattern)
		{
			list.push(arrowsDict[arrow])
		}

		return list;
	}
}