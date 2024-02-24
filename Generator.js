// Patterns that start with left
const startFromLeftPatterns = {'LDUR' : 25, 'LUDR' : 25, 'LDUDL' : 6, 'LUDUL' : 6, 'LUL' : 19, 'LDL' : 19}
// Yeah
const startFromRightPatterns = {'RUDL' : 25, 'RDUL' : 25, 'RUDUR' : 6, 'RDUDR' : 6, 'RUR' : 19, 'RDR' : 19}

const rightFacingPatterns = ['LDUR', 'LDL', 'RUR', 'RUDL', 'LDUDL', 'RUDUR']

const leftFacingPatterns = ['RDUL', 'RDR', 'LUL', 'LUDR', 'RDUDR', 'LUDUL']
// Candle down with left or right foot
const candleDownDict = {'D' : 10, 'DU' : 80, 'DUD' : 10 }
// Candle up with left or right foot
const candleUpDict = {'U' : 10, 'UD' : 80, 'UDU' : 10 }

//tot% double candle = 10 + 80/4 + 10 = 10 + 20 + 10 = 40% (was 40 + 40/3 + 20 = 73.3%)
//tot% single candle = (80*3)/4 = 60% (was 40*2/3 = 26.6%)

const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}


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

		this.addNonCandle();

		while (arrowsToGenerate > 0)
		{
			// TODO: implement random thing like tetris where after every n ALWAYS pick candle
			if (Math.floor(Math.random() * this.options["candleDens"]))	// if 0 candle, if > 0 no
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

		if (!Math.floor(Math.random() * 10))	// Randomly add L/R before adding the pattern, creates non-candle L/R anchors
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
		}
		
		do {
			pattern = this.chooseNextPattern((this.stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
		} while (this.stream.lastPatterns.includes(pattern))

		if (pattern.length == 4 && !Math.floor(Math.random() * 12))	// If stair, make big triangle . push stair now into stream, remove last arrow, pattern becomes the other stair
		{
			this.processPattern(pattern, stream);
			
			this.stream.arrows.pop(); // Remove stair's last arrow
			var stairDirection = rightFacingPatterns.includes(pattern) ? 'R' : 'L';

			// add stair facing same direction but starting from opposite arrow. Pattern is added at the end of function, very ugly, make sth like pushPattern()

			do {// TODO put this do/while check in chooseNextPattern, pass condition in while?? YES PERFECT
				pattern = this.chooseNextPattern((this.stream.nextArrow == 'R') ? startFromLeftPatterns : startFromRightPatterns)	
			} while (pattern.length != 4 || stairDirection != (rightFacingPatterns.includes(pattern) ? 'R' : 'L'))
		}

		this.processPattern(pattern, stream);
		
		return stream;
	}

	addCandle()
	{
		var pattern = "";
		
		var secondToLastArrow = this.stream.lastPatterns[0].slice(-2, -1), candlePattern;

		(secondToLastArrow == 'U') ? candlePattern = this.chooseNextPattern(candleDownDict) : candlePattern = this.chooseNextPattern(candleUpDict);

		this.convertPatternToList(candlePattern).forEach(arrow => {
			this.stream.arrows.push(arrow);
		});

		// Gets stuck if I put the lastPatterns check. Fixed by reducing lastPatterns to 2 from 3.

		if (candlePattern.length == 2)
		{
			if (Math.floor(Math.random() * 4) && !this.options['wtfMode'])	// 3/4ths of the time single candle. Skips for wtf mode
			{
				console.log("adding single candle");

				do {
					if (this.stream.nextArrow == 'L')
						pattern = this.chooseNextPattern(startFromRightPatterns);
					
					else
						pattern = this.chooseNextPattern(startFromLeftPatterns);

				} while ((pattern[1] + pattern[2] == candlePattern) && (pattern.length == 4 || pattern.length == 7)) // Prevents double stairs. Add option to allow them?
				// Actually double stairs still happen if I have LDUR and LDURUDL in a row, noncandle. TODO add condition
				this.stream.arrows.push(this.stream.nextArrow == 'L' ? "1000" : "0001");	// Ok because pattern is added later anyway
			}
			
			else	// 1/4th of the time, double candle
			{
				console.log("adding double candle");
				
				do {
					pattern = this.chooseNextPattern(this.stream.nextArrow == 'L' ? startFromLeftPatterns : startFromRightPatterns);
				} while (pattern[1] == candlePattern[1]);	// TODO(?) remove this condition? makes some boxes show up. Maybe add option
			}
		}
		
		else
		{
			console.log("adding double candle");
			// TODO I WANT UP/DOWN ANCHORS!!!!!!!!!!!
			do {
				pattern = this.chooseNextPattern(this.stream.nextArrow == 'L' ? startFromRightPatterns : startFromLeftPatterns);
			} while (pattern[1] == candlePattern.slice(-1));
		}

		this.processPattern(pattern, stream);
		
		return stream;
	}

	// Writes pattern to stream, gets nextArrow, adds to lastPatterns list
	processPattern(pattern)
	{
		this.stream.lastPatterns.unshift(pattern);
		this.stream.lastPatterns.pop(); // Keep the list with the same amount of elements

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