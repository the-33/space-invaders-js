class GameObject
{
  constructor(x = 0, y = 0, z = 0, initialDelay, timer)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.initialDelay = initialDelay;
		this.timer = timer;
		this.isActive = true;
		this.isInitialized = false;
	}

	start()
	{
	}

	update()
	{
		if(!this.isInitialized || !this.isActive) return;
		if (this.initialDelay > 0) { this.initialDelay--; return; }
		if (this.timer > 0) { this.timer--; return; }
	}

	render(ctx)
	{
		if(!this.isInitialized || !this.isActive) return;
		if (this.initialDelay > 0) return;
	}
}
