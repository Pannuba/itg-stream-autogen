class StreamBlock {

	constructor(measures, quantization, firstArrow)
	{
		this.measures = measures;
		this.quantization = quantization;
		this.nextArrow = firstArrow;
		this.arrows = [];
		this.lastPattern = null;
	}
  
	addCommas()	// Puts the ',' every *quantization* arrows (e.g. , every 16 arrows)
	{
		var finalStream = [];
		var count = 0;

		for (let i = 0; i < this.measures; i++)	// Even if there are excess arrows, it only gives the exact measures
		{
			for (let j = 0; j < this.quantization; j++)
			{
				finalStream.push(this.arrows[count++])
			}

			finalStream.push(',');
		}

		return finalStream;
	}
}
