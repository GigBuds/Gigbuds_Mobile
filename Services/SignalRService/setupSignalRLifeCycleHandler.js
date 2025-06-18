export function setupSignalRLifeCycleHandler(service) {
  if (!service) return;

  service.connection.onclose(async (error) => {
    connection.isConnected = false;
    console.log("SignalR: Connection closed", error);
    service.triggerCallback("onDisconnected", error);

    // Attempt reconnection if not manually closed
    if (error) {
      await service.handleReconnection();
    }
  });

  service.connection.onreconnecting((error) => {
    console.log("SignalR: Reconnecting...", error);
    service.triggerCallback("onReconnecting", error);
  });

  service.connection.onreconnected((connectionId) => {
    service.isConnected = true;
    service.reconnectAttempts = 0;
    console.log("SignalR: Reconnected", connectionId);
    service.triggerCallback("onReconnected", connectionId);
  });
}
