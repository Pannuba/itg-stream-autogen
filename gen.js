// Patterns that start with a foot, and the next one starts with the left arrow
const nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR', 'RDULUDR', 'RUDLDUR']
// Patterns that start with a foot, and the next one starts with the right arrow
const nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL', 'LDURUDL', 'LUDRDUL']
// Patterns that start with left
const startFromLeftPatterns = {'LDUR' : 25, 'LUDR' : 25, 'LDUDL' : 6, 'LUDUL' : 6, 'LUL' : 17, 'LDL' : 17, 'LDURUDL' : 2, 'LUDRDUL' : 2}
// Yeah
const startFromRightPatterns = {'RUDL' : 25, 'RDUL' : 25, 'RUDUR' : 6, 'RDUDR' : 6, 'RUR' : 17, 'RDR' : 17, 'RDULUDR': 2, 'RUDLDUR' : 2}
// Candle down with left or right foot
const candleDownDict = {'D' : 10, 'DU' : 80, 'DUD' : 10 }
// Candle up with left or right foot
const candleUpDict = {'U' : 10, 'UD' : 80, 'UDU' : 10 }

//tot% double candle = 10 + 80/4 + 10 = 10 + 20 + 10 = 40% (was 40 + 40/3 + 20 = 73.3%)
//tot% single candle = (80*3)/4 = 60% (was 40*2/3 = 26.6%)

const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}
// Last N patterns (3 for now). Only used for non-candles
var lastPatterns = ['X', 'X']	// Initialize with dummy values. Make part of StreamBlock?

function generateStream(stream, options)
{
	// Doesn't have to be precise, not a problem if it generates more than needed
	arrowsToGenerate = stream.measures * options["quantization"]; // TODO(?): move in StreamBlock class

	addPattern(true, stream);

	while (arrowsToGenerate > 0)
	{
		// TODO: implement random thing like tetris where after every n ALWAYS pick candle
		stream = addPattern(Math.floor(Math.random() * options["candleDens"]), stream, options);	// if 0 candle, if > 0 no
		arrowsToGenerate -= stream.lastPattern.length;
	}

	return stream;
}

function addPattern(isNotCandle = true, stream, options)	// TODO: find a way to only pass options and not make the first pattern a candle (easy)
{
	var pattern = "";
	
	if (isNotCandle)
	{
		console.log("adding no");
		do {
			pattern = chooseNextPattern((stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
		} while (lastPatterns.includes(pattern))
	}

	else	// isNotCandle is not zero. TODO(?) balance candles more (aka after x patterns if still no candle add one
	{
		var secondToLastArrow = stream.lastPattern.slice(-2, -1), candlePattern;

		(secondToLastArrow == 'U') ? candlePattern = chooseNextPattern(candleDownDict) : candlePattern = chooseNextPattern(candleUpDict);

		// TODO make function
		convertPatternToList(candlePattern).forEach(arrow => {
			stream.arrows.push(arrow);
		});

		// Gets stuck if I put the lastPatterns check. Fixed by reducing lastPatterns to 2 from 3.

		if (candlePattern.length == 2)
		{
			if (Math.floor(Math.random() * 4) && !options['wtfMode'])	// 3/4ths of the time single candle. Skips for wtf mode
			{
				console.log("adding single candle");

				do {
					if (nextArrowLeftPatterns.includes(stream.lastPattern))
						pattern = chooseNextPattern(startFromRightPatterns);
					
					else
						pattern = chooseNextPattern(startFromLeftPatterns);

				} while ((pattern[1] + pattern[2] == candlePattern) && (pattern.length == 4 || pattern.length == 7)) // Prevents double stairs. Add option to allow them?
				// Actually double stairs still happen if I have LDUR and LDURUDL in a row, noncandle. TODO add condition
				stream.arrows.push(nextArrowLeftPatterns.includes(stream.lastPattern) ? "1000" : "0001");	// Ok because pattern is added later anyway
			}
			
			else	// 1/4th of the time, double candle
			{
				console.log("adding double candle");
				
				do {
					pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromLeftPatterns : startFromRightPatterns);
				} while (pattern[1] == candlePattern[1]);	// TODO(?) remove this condition? makes some boxes show up. Maybe add option
			}
		}
		
		else
		{
			console.log("adding double candle");
			// TODO I WANT UP/DOWN ANCHORS!!!!!!!!!!!
			do {
				pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromRightPatterns : startFromLeftPatterns);
			} while (pattern[1] == candlePattern.slice(-1));
		}
	}

	stream.lastPattern = pattern;

	lastPatterns.unshift(pattern);
	lastPatterns.pop(); // Keep the list with the same amount of elements

	console.log(pattern);

	(pattern.slice(-1) == 'R') ? stream.nextArrow = 'L' : stream.nextArrow = 'R';

	convertPatternToList(pattern).forEach(arrow => {
		stream.arrows.push(arrow);
	});
	
	return stream;
}

function chooseNextPattern(patternDict)
{
	var num = Math.floor(Math.random() * (100 - 1));	// 100 is the total weight

	for (const [pattern, weight] of Object.entries(patternDict))
	{
		if (num < weight) return pattern;

		num -= weight;
	}
}

// Converts "LUDL" to ["1000", "0100", "0010", "0001"]
function convertPatternToList(pattern)
{
	var list = [];

	for (const arrow of pattern)
	{
		list.push(arrowsDict[arrow])
	}

	return list;
}

// Called for each stream block. Writes the whole output chart
function getNewChart(stream, streamBegin, streamEnd, inputLines)
{
	var outputLines = [], streamLineCounter = 0, isStreamAdded = false;

	inputLines.forEach((line, i) => {
		if (i < streamBegin || i > streamEnd)	// We're before/after the generated stream
		{
			outputLines.push(line)
		}

		else if (!isStreamAdded)	// Put the generated stream instead of the quad hold
		{
			stream.addCommas().forEach((line, j) => {
				//console.log("adding generated", line)
				outputLines.push(line);
			});
			
			isStreamAdded = true;
		}
	});

	return outputLines.join("\n");
}

// Removes consecutive arrows in a pattern ["1000", "0100", "0100", "0100"] --> ["1000", "0100", "1000"]
function removeJacks(pattern)
{
	for (let i = 0; i < pattern.length; i++)
	{
		if (pattern[++i] == pattern[i])
		{
			pattern.splice(i, 1);
			i--;
		}
	}
	
	return pattern;
}

// Looks at the arrows before the stream block to see if it should start with left or right
function findFirstArrow(lines, i)
{
	for (let j = i; j > 0; j--)	// goes back line by line from the 2222
	{
		if (["1000", "3000", "1100", "3300", "1010", "3030"].includes(lines[j])) return 'R';
		
		if (["0001", "0003", "0011", "0033", "0101", "0303"].includes(lines[j])) return 'L';

		if (["0100", "0010", "0300", "0030"].includes(lines[j]))	// Builds pattern of last arrows, then analyses it
		{
			patt = [lines[j]];
			
			for (let k = --j; k > 0; k--)
			{
				if (["0100", "0010"].includes(lines[k]))
				{
					patt.unshift(lines[k]);
				}

				if (["1000", "0001"].includes(lines[k]))
				{
					patt.unshift(lines[k]);
					// If patt has an even number of arrows, firstArrow is the first one of patt (L/R). If odd, it's the opposite
					patt = removeJacks(patt);
					if ( (patt.length % 2) && (patt[0] == "1000")) return 'R';
					if ( (patt.length % 2) && (patt[0] == "0001")) return 'L';
					if (!(patt.length % 2) && (patt[0] == "0001")) return 'R';
					if (!(patt.length % 2) && (patt[0] == "1000")) return 'L';
				}
			}
		}
	}

	return 'R';	// Fallback
}

// Returns [...arrows...] with no commas
// TODO: add firstMeasure and lastMeasure to StreamBlock!
function getMeasure(lines, i)
{
	var measure = [], begin, end;

	for (let j = i; j > 0; j--)  // Goes from i to the PREVIOUS ,
	{
		if (lines[j] == ",")
		{
			begin = j + 1;
			break;
		}
	}

	for (let j = i; j < lines.length; j++)  // Goes from i to the NEXT ,
	{
		if (lines[j] == "," || lines[j] == ";")
		{
			end = j - 1;
			break;
		}
	}

	for (let j = begin; j <= end; j++)
	measure.push(lines[j]);
	console.log("beign ", begin);
	console.log("end", end);

	return measure;
}

function findStreamBegin(lines, i)
{
	for (let j = i; j > 0; j--)	// Goes from 2222 to the PREVIOUS ,
	{
		if (lines[j] == ",")
		{
			return j + 1;	// index of line after ,
		}
	}
}

function findStreamEnd(lines, i)
{
	for (let j = i; j < lines.length; j++)	// Goes from 3333 to the NEXT ,
	{
		if (lines[j] == "," || lines[j] == ";")
		{
			return j - 1;	// index of line before ,
		}
	}
}

function noPlagiarism(chart)	// TODO: calculate breakdown???????
{
	lines = chart.split('\n');
	
	for (let i = 0; i < lines.length; i++)
	{
		if (lines[i] == "#NOTES:")	// Step artist field is the second line after #NOTES:
		{
			stepArtist = lines[i+2].match(/[ a-z]*/i);	// Includes spaces before name
			lines[i+2] = stepArtist + ", itg-stream-autogen:"
		}
	}
	
	return lines.join('\n');
}

function main(chart, options)
{
	chart = noPlagiarism(chart) // Unused because it does this for all charts
	
	// Loop for every quad hold found in the input chart
	do {
		noMoreStreams = true;
		lines = chart.split('\n');	// List of strings, each one is a line

		var measures = 0, streamBegin = 0, streamEnd = 0, insideStream = false, firstArrow = '', quantization;
		var firstMeasure, lastMeasure;
		
		for (let i = 0; i < lines.length; i++)
		{
			var line = lines[i];	// seta ultra

			if (line == "2222" || line == "4444")	// Start of quad hold
			{
				options["quantization"] = (line[0] == '2' ? options['quantHolds'] : options['quantRolls']);
				streamBegin = findStreamBegin(lines, i);
				firstArrow = findFirstArrow(lines, i);
				console.log("firstARROW", firstArrow);
				firstMeasure = getMeasure(lines, i);
				noMoreStreams = false;			
				insideStream = true;
			}

			if (insideStream && i >= streamBegin)   // Additional check if first measure was skipped (otherwise it creates one more measures bc it saw the comma)
			{
				console.log("processing line", line);

				if (line == ",") measures++;

				if (line == "3333")
				{
					measures++;	// Counts the measure with the end of quad hold
					streamEnd = findStreamEnd(lines, i);
					lastMeasure = getMeasure(lines, i);
					insideStream = false;
					break;
				}
			}
		}

		console.log("start st: ", streamBegin, "\nend strm: ", streamEnd, "\nmeasures: ", measures)

		if (!noMoreStreams)
		{
			console.log(options)
			stream = new StreamBlock(measures, options["quantization"], firstArrow, firstMeasure, lastMeasure);
			generateStream(stream, options)
			chart = getNewChart(stream, streamBegin, streamEnd, lines);
		}
	} while (!noMoreStreams) // faking

	var blob = new Blob([chart], { type: 'text/plain' });
	var file = new File([blob], "output.sm", {type: "text/plain"});
	
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = URL.createObjectURL(file);
	link.download = file.name;
	document.body.appendChild(link);
	link.click();
}

function seParti()
{
	var chart = document.getElementById('chart').files[0];
	var quantHolds = document.getElementById('holds-quant').value;
	var quantRolls = document.getElementById('rolls-quant').value;
	var customQuantHolds = document.getElementById("customquant-holds").value;
	var customQuantRolls = document.getElementById("customquant-rolls").value;
	var candleDens = document.getElementById("candles").value;
	var wtfMode = (candleDens == 0) ? true : false;

	if (customQuantHolds && customQuantHolds != 0) quantHolds = customQuantHolds;
	if (customQuantRolls && customQuantRolls != 0) quantRolls = customQuantRolls;

	var options = {
		'quantHolds' : quantHolds,
		'quantRolls' : quantRolls,
		'candleDens' : candleDens,		// TODO: add candleDens for rolls
		'wtfMode' : wtfMode
	};

	var reader = new FileReader();

	reader.onload = (function() {
		return function(e) {
			main(e.target.result, options)
		};
	})(chart);

	reader.readAsText(chart);
}