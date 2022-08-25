from backports.zoneinfo import ZoneInfo
from datetime import datetime
from time import sleep
import json
import retrieve_data
import add_today

def main():
	tz = ZoneInfo("America/New_York")
	now = datetime.now(tz=tz)
	with open("data/data.json") as file:
		all_data = json.load(file)["data"]
	today_in_all_data = all_data[-1]["d"][0] == now.year and all_data[-1]["d"][1] == now.month \
		and all_data[-1]["d"][2] == now.day
	if not today_in_all_data:
		# If today isn't in data file yet, add today
		print("Adding today...")
		add_today.main()
		# Synchronize
		with open("data/data.json") as file:
			all_data = json.load(file)["data"]

	today_data = all_data[-1]
	yesterday_data = all_data[-2]
	updated_today = today_data["n"][0] > yesterday_data["n"][0] or today_data["n"][2] > yesterday_data["n"][2]
	print(f"Updated today: {updated_today}")
	if not updated_today:
		if now.hour == 23 and now.minute >= 40:
			# If today hasn't been updated in data file, and time is 23:40 or later, quickly update now as all
			# other chances of updating have passed.
			# Otherwise, wait for next update cycle
			print("Attempt update data...")
			updated_today = retrieve_data.main()

	while now.second != 0:
		# Wait until next minute
		sleep(1)
		now = datetime.now(tz=tz)
	
	while True:
		now = datetime.now(tz=tz)
		if now.hour < 10:
			time = "0" + str(now.hour) + ":"
		else:
			time = str(now.hour) + ":"
		if now.minute < 10:
			time += "0" + str(now.minute)
		else:
			time += str(now.minute)
		print(f"\rIt is currently {time}", end="", flush=True)
		if now.hour == 0 and now.minute == 0:
			print("\nAdding today...")
			add_today.main()
			updated_today = False

		if now.weekday() in (0, 1, 2, 3, 4):
			if not updated_today and now.hour in (22, 23) and now.minute % 20 == 0:
				print("\nAttempt update data...")
				updated_today = retrieve_data.main()
		else:
			if not updated_today and now.hour == 23 and now.minute % 20 == 0:
				print("\nAttempt update data...")
				updated_today = retrieve_data.main()
		sleep(60 - now.second)

if  __name__ == "__main__":
	main()
