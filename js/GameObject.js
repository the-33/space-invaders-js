class GameObject
{
  constructor(x = 0, y = 0, z = 0)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.isActive = true;
		this.isInitialized = false;
	}

  start()
	{

	}

  update(dt)
	{
		if(this.isInitialized && this.isActive)
		{

		}
	}

  render(ctx)
	{
		if(this.isInitialized && this.isActive)
		{

		}
	}
}
