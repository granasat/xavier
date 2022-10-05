#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

use env_logger;
use log::{info, debug};
use std::time::Duration;
use std::{
    sync::{Arc, Mutex},
    thread,
};

use log::{Level, LevelFilter, Metadata, Record};
use std::io::Write;
use std::sync::mpsc::{self, Receiver, Sender};

use eframe::egui;

fn log() {
    // info!("Hello, world!");
    // thread::sleep(Duration::from_millis(3000));
    // info!("Logged!");
    // debug!("Logged debug!");
    // thread::sleep(Duration::from_millis(3000));
    // info!("logged again!");
}

pub fn gui() {
    std::env::set_var("RUST_LOG", "info");


    let lg: Arc<Mutex<Vec<Log>>> = Arc::new(Mutex::new(vec![]));   

    let options = eframe::NativeOptions::default();

    {
        let lg = lg.clone();
        eframe::run_native(
            "Xavier",
            options,
            Box::new(|cc| {
                let rep = cc.egui_ctx.clone();
                let xavier = Xavier::new(cc, lg);
                
                thread::spawn(move || {
                    log();
                });

                Box::new(xavier)
            }),
        );
    }
}

struct Log {
    level: String,
    message: String
}

struct Xavier {
    log: Arc<Mutex<Vec<Log>>>,
    // repaint_rx: Receiver<i32>,
    resizable: bool,
    vertical_scroll_offset: Option<f32>,
}

impl Xavier {
    fn new(cc: &eframe::CreationContext<'_>, lg: Arc<Mutex<Vec<Log>>>) -> Xavier {
        cc.egui_ctx.set_pixels_per_point(1.5);

        let mut builder = env_logger::Builder::new();


        builder
        .format({
            let log = lg.clone();
            let a = cc.egui_ctx.clone();
            move |buf, record| {
                let mut lg_unlock = log.lock().unwrap();
                let log_value = format!("{}: {}", record.level(), record.args());
                
                let mut mssg = record.args().to_string();
                if mssg.len() > 100 {
                    mssg = (&mssg[0..100]).to_string();
                }

                lg_unlock.push(Log {
                    level: record.level().to_string(),
                    message:  mssg
                });

                a.request_repaint();
                writeln!(buf, "{}", log_value)
            }
        })
        .filter(None, LevelFilter::Debug)
        .init();

        Xavier {
            log: lg.clone(),
            // repaint_rx: rx,
            resizable: false,
            vertical_scroll_offset: None,
        }
    }

    fn table_ui(&mut self, ui: &mut egui::Ui) {
        use egui_extras::{Size, TableBuilder};

        let text_height = egui::TextStyle::Body.resolve(ui.style()).size;

        let table = TableBuilder::new(ui)
            .striped(true)
            .cell_layout(egui::Layout::left_to_right(egui::Align::Center))
            .column(Size::initial(60.0).at_least(40.0))
            .column(Size::remainder().at_least(60.0))
            .resizable(self.resizable);

        //
        table
            .header(20.0, |mut header| {
                header.col(|ui| {
                    ui.heading("Level");
                });
                header.col(|ui| {
                    ui.heading("Message");
                });
            })
            .body(|mut body| {
                let log = self.log.lock().unwrap();
                body.rows(text_height, log.len(), |row_index, mut row| {
                    row.col(|ui| {
                        ui.label(log[row_index].level.to_owned());
                    });
                    row.col(|ui| {
                        ui.add(egui::Label::new(log[row_index].message.to_owned()).wrap(false));
                    });
                });
            });
    }
}

impl eframe::App for Xavier {
    fn update(&mut self, ctx: &eframe::egui::Context, frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.vertical(|ui| {
                ui.checkbox(&mut self.resizable, "Resizable columns");

                ui.label("Table type:");
            });

            ui.separator();

            // Leave room for the source code link after the table demo:
            use egui_extras::{Size, StripBuilder};
            StripBuilder::new(ui)
                .size(Size::remainder()) // for the table
                .size(Size::exact(10.0)) // for the source code link
                .vertical(|mut strip| {
                    strip.cell(|ui| {
                        self.table_ui(ui);
                    });
                    // strip.cell(|ui| {
                    //     ui.vertical_centered(|ui| {
                    //         ui.add(crate::egui_github_link_file!());
                    //     });
                    // });
                });
        });
        // match self.repaint_rx.try_recv() {
        //     Ok(_) => {
        //         println!("Repaint requested");
        //         // ctx.rep;
        //     }
        //     Err(_) => {}
        // };
    }

}

fn clock_emoji(row_index: usize) -> String {
    char::from_u32(0x1f550 + row_index as u32 % 24)
        .unwrap()
        .to_string()
}