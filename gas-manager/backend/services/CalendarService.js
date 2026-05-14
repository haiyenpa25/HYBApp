/**
 * Service to sync tasks with Google Calendar
 */
class CalendarService {
  constructor(calendarId) {
    if (calendarId && calendarId !== 'default') {
      this.calendar = CalendarApp.getCalendarById(calendarId) || CalendarApp.getDefaultCalendar();
    } else {
      this.calendar = CalendarApp.getDefaultCalendar();
    }
  }

  static getAllOwned() {
    const calendars = CalendarApp.getAllOwnedCalendars();
    return calendars.map(c => ({
      id: c.getId(),
      name: c.getName(),
      color: c.getColor()
    }));
  }

  static create(name) {
    const cal = CalendarApp.createCalendar(name);
    return {
      id: cal.getId(),
      name: cal.getName(),
      color: cal.getColor()
    };
  }

  static delete(id) {
    if (id === CalendarApp.getDefaultCalendar().getId()) return false; // Cannot delete primary
    const cal = CalendarApp.getCalendarById(id);
    if (cal) {
      cal.deleteCalendar();
      return true;
    }
    return false;
  }

  createTaskEvent(title, date) {
    try {
      const event = this.calendar.createAllDayEvent(`[Task] ${title}`, date);
      return event.getId();
    } catch (e) {
      console.error('Failed to create calendar event', e);
      return null;
    }
  }

  updateEventColor(eventId, colorId) {
    if (!eventId) return;
    try {
      const event = this.calendar.getEventById(eventId);
      if (event) {
        event.setColor(colorId);
      }
    } catch (e) {
      console.error('Failed to update event color', e);
    }
  }

  deleteTaskEvent(eventId) {
    if (!eventId) return false;
    try {
      const event = this.calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent();
        return true;
      }
    } catch (e) {
      console.error('Failed to delete calendar event', e);
    }
    return false;
  }

  updateTaskEvent(eventId, title, date) {
    if (!eventId) return false;
    try {
      const event = this.calendar.getEventById(eventId);
      if (event) {
        event.setTitle(`[Task] ${title}`);
        event.setAllDayDate(new Date(date));
        return true;
      }
    } catch (e) {
      console.error('Failed to update calendar event', e);
    }
    return false;
  }
}
