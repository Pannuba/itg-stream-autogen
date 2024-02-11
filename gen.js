// Patterns that start with a foot, and the next one starts with the left arrow
const nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR']
// Patterns that start with a foot, and the next one starts with the right arrow
const nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL']
// Patterns that start with left
const startFromLeftPatterns = {'LDUR' : 29, 'LUDR' : 29, 'LDUDL' : 3, 'LUDUL' : 3, 'LUL' : 18, 'LDL' : 18}
// Yeah
const startFromRightPatterns = {'RUDL' : 29, 'RDUL' : 29, 'RUDUR' : 3, 'RDUDR' : 3, 'RUR' : 18, 'RDR' : 18 }
// Candle down with left or right foot
const candleDownDict = {'D' : 40, 'DU' : 50, 'DUD' : 10 }
// Candle up with left or right foot
const candleUpDict = {'U' : 40, 'UD' : 50, 'UDU' : 10 }

const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}
// Last N patterns (3 for now). If a pattern to be added is in this list, it is discarded
var lastPatterns = ['X', 'X']	// Initialize with dummy values. Make part of StreamBlock?

function generateStream(measures, quantization, candleDens, firstArrow)
{
	// Right now it only creates a list of arrows, will turn it to measures/, later, strem class etc
	stream = new StreamBlock(measures, quantization, firstArrow);

	// Need to generate measures * quantization arrows. Doesn't have to be precise, not a problem if it generates more than needed
	arrowsToGenerate = measures * quantization;

	addPattern(true, stream);

	while (arrowsToGenerate > 0)
	{
		// TODO: implement random thing like tetris where after every n ALWAYS pick candle
		stream = addPattern(Math.floor(Math.random() * candleDens), stream);	// if 0 candle, if > 0 no
		arrowsToGenerate -= stream.lastPattern.length;
	}

	console.log(stream);
	return stream;
}

function addPattern(isNotCandle = true, stream)
{
	console.log("lastpatterns:")
	console.log(lastPatterns)
	console.log("adding pattern ");
	if (isNotCandle)
	{
		do {
			pattern = chooseNextPattern((stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
		} while (lastPatterns.includes(pattern))
	}

	else	// isNotCandle is not zero. TODO(?) balance candles more (aka after x patterns if still no candle add one
			// and/or remove this and add pre-made candles to the dictionaries
	{
		console.log("candle");
		var secondToLastArrow = stream.lastPattern.slice(-2, -1);
		var candlePattern;

		(secondToLastArrow == 'U') ? candlePattern = chooseNextPattern(candleDownDict) : candlePattern = chooseNextPattern(candleUpDict);

		// TODO make function
		convertPatternToList(candlePattern).forEach(arrow => {
			stream.arrows.push(arrow);
		});

		// Gets stuck if I put the lastPatterns check. Fixed by reducing lastPatterns to 2 from 3.

		if (candlePattern.length == 2)
		{
			do {
				pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromLeftPatterns : startFromRightPatterns);
				console.log(pattern[1]);
			} while (pattern[1] == candlePattern[1]);
		}

		else	// candlePattern.length = 1 | 3
		{
			do {
				pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromRightPatterns : startFromLeftPatterns);				console.log(pattern[1]);
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
	var totalWeight = 100;
	var num = Math.floor(Math.random() * (totalWeight - 1));

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
		console.log(arrowsDict[arrow]);
		list.push(arrowsDict[arrow])
	}

	return list;
}

// Called for each stream block. Writes the whole output chart
function getNewChart(stream, streamBegin, streamEnd, inputLines)
{
	var outputLines = [];

	streamLineCounter = 0
	var isStreamAdded = false

	inputLines.forEach((line, i) => {
		console.log("processing", line, ", i = ", i)
		if (i < streamBegin || i > (streamEnd - 1))	// We're before/after the generated stream
		{
			console.log("adding", line)
			console.log(line, "is before ", streamBegin, " and after ", streamEnd)
			outputLines.push(line)
		}

		else if (!isStreamAdded)	// Put the generated stream instead of the quad hold
		{
			// add stream
			stream.addCommas().forEach((line, j) => {
				console.log("adding generated", line)
				outputLines.push(line)
			});
			isStreamAdded = true;
		}
	});

	return outputLines.join("\n");
	// turn outputlines into file, output.sm
}

// Looks at the arrows before the stream block to see if it should start with left or right
function findFirstArrow(lines, i)
{
	for (let j = i; j > 0; j--)	// goes back line by line from the 2222
	{
		if (["1000", "1100", "1010"].includes(lines[j])) return 'R';
		
		if (["0001", "0011", "0101"].includes(lines[j])) return 'L';

		if (lines[j] == "0010" || lines[j] == "0100")	// Builds pattern of last arrows, then analyses it
		{
			patt = [lines[j]]
			for (let k = --j; k > 0; k--)
			{
				if (["0100", "0010"].includes(lines[k]))
				{
					patt.unshift(lines[k])
				}

				if (["1000", "0001"].includes(lines[k]))
				{
					patt.unshift(lines[k])
					console.log("PATT")
					console.log(patt)
					// If patt has an even number of arrows, firstArrow is the first one of patt (L/R). If odd, it's the opposite
					// TODO: remove duplicates in a row (jacks)
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

function main(chart, quantization = 16, candleDens = 8)
{
	//console.log(chart)
	do {
		noMoreStreams = true;
		lines = chart.split('\n');	// List of strings, each one is a line

		var measures = 0, streamBegin = 0, streamEnd = 0, insideStream = false, firstArrow = '';
		for (let i = 0; i < lines.length; i++)
		{
			var line = lines[i];	// seta ultra

			if (line == "2222")	// Start of quad hold
			{
				firstArrow = findFirstArrow(lines, i);
				console.log("firstARROW", firstArrow);
				noMoreStreams = false;
				insideStream = true;
				streamBegin = i;
			}

			if (insideStream)
			{
				console.log("processing line", line);

				if (line == ",") measures++;

				if (line == "3333")
				{
					streamEnd = i;
					insideStream = false;

					if (lines[++i] == "," || lines[++i] == ";")
					{
						measures++;	// adds measure if there's nothing between quad hold and end of measure
						streamEnd += 2;	// TODO: remove magic numbers
					}

					break;
				}
			}
		}

		console.log("start st: ", streamBegin)
		console.log("end strm: ", streamEnd)
		console.log("measures: ", measures)

		if (!noMoreStreams)
		{
			stream = generateStream(measures, quantization, candleDens, firstArrow)	// Generate n measures of 16ths
			chart = getNewChart(stream, streamBegin, streamEnd, lines);
		}
	} while (!noMoreStreams) // faking

	console.log("OUTPUT CHART");
	console.log(chart);
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
	var quantization = document.getElementById('quantization').value;
	var customQuant = document.getElementById("customquant").value;
	var candleDens = document.getElementById("candles").value;

	if (customQuant && customQuant != 0) quantization = customQuant;


	var reader = new FileReader();

	reader.onload = (function()
	{
		return function(e)
		{
			main(e.target.result, quantization, candleDens)
		};
	})(chart);

	reader.readAsText(chart);
}