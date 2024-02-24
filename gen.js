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
				////console.log("adding generated", line)
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
		if (pattern[i] == pattern[i+1])
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
function getMeasure(lines, i)
{
	var measure = [], begin, end;

	for (let j = i; j > 0; j--)  // Goes from i to the PREVIOUS ,
	{
		if (lines[j] == "," || lines[j].slice(-1) == ":")
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

	return measure;
}

function findStreamBegin(lines, i)
{
	for (let j = i; j > 0; j--)	// Goes from 2222 to the PREVIOUS ,
	{
		if (lines[j] == "," || lines[j].slice(-1) == ":")
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

		var measures = 0, streamBegin = 0, streamEnd = 0, insideStream = false, firstArrow = '';
		var firstMeasure, lastMeasure;
		
		for (let i = 0; i < lines.length; i++)
		{
			var line = lines[i];	// seta ultra

			if (line == "2222" || line == "4444")	// Start of quad hold
			{
				options["quantization"] = (line[0] == '2' ? options['quantHolds'] : options['quantRolls']);
				streamBegin = findStreamBegin(lines, i);
				firstArrow = findFirstArrow(lines, i);
				//console.log("firstARROW", firstArrow);
				firstMeasure = getMeasure(lines, i);
				noMoreStreams = false;			
				insideStream = true;
			}

			if (insideStream && i >= streamBegin)   // Additional check if first measure was skipped (otherwise it creates one more measures bc it saw the comma)
			{
				////console.log("processing line", line);

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

		//console.log("start st: ", streamBegin, "\nend strm: ", streamEnd, "\nmeasures: ", measures)

		if (!noMoreStreams)
		{
			//console.log(options)
			stream = new StreamBlock(measures, options["quantization"], firstArrow, firstMeasure, lastMeasure);
			gen = new Generator(stream, options);	// Create one Generator only once? TODO
			gen.generateStream() // stream = ..?
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