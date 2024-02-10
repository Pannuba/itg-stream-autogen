class StreamBlock {

	constructor(measures, quantization)
	{
		this.measures = measures;
		this.quantization = quantization;
		this.nextArrow = 'R';
		this.arrows = [];
		this.lastPattern = null;
	}
  
	addCommas()	// Puts the , every *quantization* arrows (e.g. every 16 arrows)
	{
		var finalStream = [];
		var count = 0;

		for (let i = 0; i < this.measures; i++)
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
